import axios from 'axios';
import { API_CONFIG, ENDPOINTS, SERVER_URL } from '../config/api.config';
import AppStorage from './AppStorage';
import AuthStorage from './AuthStorage';

const sanitizePhoneNumber = phoneNumber =>
  String(phoneNumber || '')
    .replace(/\D/g, '')
    .slice(0, 10);

const sanitizeOTP = otp =>
  String(otp || '')
    .replace(/\D/g, '')
    .slice(0, 6);

const resolveAssetUrl = value => {
  if (!value || typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return `${SERVER_URL.replace(/\/$/, '')}/${trimmed.replace(/^\//, '')}`;
};

const CACHE_PREFIX = '@api_cache';
const DEFAULT_CACHE_TTL = 60 * 1000;
const MAX_RETRIES = 2;

const CACHE_TTL = {
  profile: 5 * 60 * 1000,
  bankAccounts: 2 * 60 * 1000,
  wallet: 30 * 1000,
  paymentConfig: 10 * 60 * 1000,
  banners: 30 * 60 * 1000,
  featuredIndices: 60 * 1000,
  marketIndices: 60 * 1000,
  allIndices: 60 * 1000,
  categories: 30 * 60 * 1000,
  transactions: 30 * 1000,
  indexDetails: 60 * 1000,
  indexHistory: 60 * 1000,
  indexDailyHistory: 60 * 1000,
  investmentInfo: 60 * 1000,
  myOrders: 30 * 1000,
  portfolio: 30 * 1000,
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const stableSortObject = value => {
  if (Array.isArray(value)) {
    return value.map(stableSortObject);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableSortObject(value[key]);
        return acc;
      }, {});
  }

  return value;
};

const serializeParams = (params = {}) =>
  JSON.stringify(stableSortObject(params));

const makeCacheKey = (key, params = {}) =>
  `${CACHE_PREFIX}:${key}:${serializeParams(params)}`;

const getCachedEnvelope = (key, params = {}) => {
  try {
    return AppStorage.getJSON(makeCacheKey(key, params), null);
  } catch (error) {
    console.error(`❌ Cache read failed for ${key}:`, error);
    return null;
  }
};

const setCachedEnvelope = (key, params = {}, data) => {
  try {
    AppStorage.setJSON(makeCacheKey(key, params), {
      data,
      cachedAt: Date.now(),
    });
  } catch (error) {
    console.error(`❌ Cache write failed for ${key}:`, error);
  }
};

const removeCachedEnvelope = (key, params = {}) => {
  try {
    AppStorage.remove(makeCacheKey(key, params));
  } catch (error) {
    console.error(`❌ Cache remove failed for ${key}:`, error);
  }
};

const isCacheFresh = (envelope, ttl = DEFAULT_CACHE_TTL) => {
  if (!envelope?.cachedAt) return false;
  return Date.now() - envelope.cachedAt < ttl;
};

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT || 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      async config => {
        const token = await AuthStorage.getToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }

        console.log(
          `📤 API Request: ${config.method?.toUpperCase()} ${config.url}`,
        );
        return config;
      },
      error => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      },
    );

    this.api.interceptors.response.use(
      response => {
        console.log(
          `📥 API Response: ${response.config.url} - ${response.status}`,
        );
        return response;
      },
      async error => {
        const config = error?.config || {};
        const status = error?.response?.status;
        const message = error?.response?.data?.message || error.message;
        const url = config?.url || '';
        const method = String(config?.method || 'get').toLowerCase();
        const isGet = method === 'get';
        const shouldRetry =
          isGet &&
          !config._noRetry &&
          (!error.response ||
            (status >= 500 && status < 600) ||
            error.code === 'ECONNABORTED');

        if (!(status === 404 && url.includes('/market/price-history'))) {
          console.error(
            '❌ Response Error:',
            error.response?.data || error.message,
          );
        } else {
          console.log(`ℹ️ Price history unavailable: ${url} - ${message}`);
        }

        if (shouldRetry) {
          config._retryCount = config._retryCount ?? 0;

          if (config._retryCount < MAX_RETRIES) {
            config._retryCount += 1;
            const backoff = 250 * 2 ** config._retryCount;
            console.log(
              `🔁 Retrying ${url} in ${backoff}ms (attempt ${config._retryCount}/${MAX_RETRIES})`,
            );
            await sleep(backoff);
            return this.api(config);
          }
        }

        if (status === 401) {
          await AuthStorage.clearAuth();
          this.clearUserScopedCache();
        }

        return Promise.reject(error);
      },
    );
  }

  handleError(error) {
    if (error.response) {
      const message = error.response.data?.message || 'Something went wrong';
      return {
        success: false,
        message,
        statusCode: error.response.status,
        errors: error.response.data?.errors || null,
      };
    } else if (error.request) {
      return {
        success: false,
        message:
          error.code === 'ECONNABORTED'
            ? 'Request timed out. Please try again.'
            : 'Network error. Please check your connection.',
      };
    } else {
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  clearUserScopedCache() {
    const prefixes = [
      'profile',
      'bankAccounts',
      'wallet',
      'paymentConfig',
      'transactions',
      'myOrders',
      'portfolio',
      'investmentInfo',
      'indexDetails',
      'indexHistory',
      'indexDailyHistory',
    ];

    try {
      prefixes.forEach(prefix => {
        if (typeof AppStorage.removeByPrefix === 'function') {
          AppStorage.removeByPrefix(`${CACHE_PREFIX}:${prefix}:`);
        }
      });
    } catch (error) {
      console.error('❌ Failed clearing user scoped cache:', error);
    }
  }

  invalidateCache(keys = []) {
    try {
      keys.forEach(entry => {
        if (!entry) return;

        if (typeof entry === 'string') {
          if (typeof AppStorage.removeByPrefix === 'function') {
            AppStorage.removeByPrefix(`${CACHE_PREFIX}:${entry}:`);
          }
          return;
        }

        if (entry.key) {
          if (entry.exact) {
            removeCachedEnvelope(entry.key, entry.params || {});
          } else if (typeof AppStorage.removeByPrefix === 'function') {
            AppStorage.removeByPrefix(`${CACHE_PREFIX}:${entry.key}:`);
          }
        }
      });
    } catch (error) {
      console.error('❌ Cache invalidation failed:', error);
    }
  }

  async cacheFirstRequest({
    cacheKey,
    cacheParams = {},
    ttl = DEFAULT_CACHE_TTL,
    preferCache = true,
    backgroundRefresh = true,
    requestFn,
    transform = response => response,
  }) {
    const cached = getCachedEnvelope(cacheKey, cacheParams);
    const hasCachedData =
      cached && typeof cached.data !== 'undefined' && cached.data !== null;
    const fresh = isCacheFresh(cached, ttl);

    if (preferCache && hasCachedData) {
      if (backgroundRefresh || !fresh) {
        requestFn()
          .then(response => {
            const freshData = transform(response);
            setCachedEnvelope(cacheKey, cacheParams, freshData);
          })
          .catch(error => {
            console.log(
              `ℹ️ Background refresh failed for ${cacheKey}:`,
              error?.message || error,
            );
          });
      }

      return {
        success: true,
        data: cached.data,
        fromCache: true,
        stale: !fresh,
        cachedAt: cached.cachedAt,
      };
    }

    const response = await requestFn();
    const data = transform(response);
    setCachedEnvelope(cacheKey, cacheParams, data);

    return {
      success: true,
      data,
      fromCache: false,
      stale: false,
      cachedAt: Date.now(),
    };
  }

  normalizeMarketIndex(data) {
    return {
      ...data,
      id: data?._id || data?.id || null,
      _id: data?._id || data?.id || null,
      name: data?.name || '',
      symbol: data?.symbol || '',
      category: data?.category || null,
      categoryId:
        data?.categoryId || data?.category?._id || data?.category || null,
      categoryName: data?.categoryName || data?.category?.name || '',
      categorySlug: data?.categorySlug || data?.category?.slug || '',
      currentValue: Number(data?.currentValue || 0),
      highValue: Number(data?.highValue || 0),
      lowValue: Number(data?.lowValue || 0),
      previousClose: Number(data?.previousClose || 0),
      change: Number(data?.change || 0),
      changePercent: Number(data?.changePercent || 0),
      defaultDailyRate:
        data?.defaultDailyRate === null ||
        typeof data?.defaultDailyRate === 'undefined'
          ? null
          : Number(data?.defaultDailyRate),
      minimumInvestment:
        data?.minimumInvestment === null ||
        typeof data?.minimumInvestment === 'undefined'
          ? null
          : Number(data?.minimumInvestment),
      minimumTradeAmount:
        data?.minimumInvestment === null ||
        typeof data?.minimumInvestment === 'undefined'
          ? null
          : Number(data?.minimumInvestment),
      logoUrl: resolveAssetUrl(data?.logoUrl),
      rawLogoUrl: data?.logoUrl || '',
      isFeatured: !!data?.isFeatured,
      isActive: typeof data?.isActive === 'boolean' ? data.isActive : true,
      marketCap: Number(data?.marketCap || 0),
      volume: Number(data?.volume || 0),
      description: data?.description || '',
      raw: data,
    };
  }

  normalizeInvestmentPreview(data = {}) {
    return {
      indexId: data?.indexId || null,
      amount: Number(data?.amount || 0),
      effectiveDailyRate: Number(
        data?.effectiveDailyRate ?? data?.dailyRate ?? data?.rate ?? 0,
      ),
      dailyInterestAmount: Number(
        data?.dailyInterestAmount ??
          data?.dailyEarning ??
          data?.perDayReturn ??
          0,
      ),
      total30DaysEstimate: Number(
        data?.total30DaysEstimate ??
          data?.estimated30DayReturn ??
          data?.estimated30DaysReturn ??
          data?.totalEstimatedInterest ??
          0,
      ),
      rateSource: data?.rateSource || '',
      slabId: data?.slabId || null,
      customDailyRate: data?.customDailyRate ?? null,
      minAmount: Number(data?.minAmount || 0),
      maxAmount: Number(data?.maxAmount || 0),
      minimumInvestment:
        data?.minimumInvestment === null ||
        typeof data?.minimumInvestment === 'undefined'
          ? null
          : Number(data?.minimumInvestment),
      minimumTradeAmount:
        data?.minimumInvestment === null ||
        typeof data?.minimumInvestment === 'undefined'
          ? null
          : Number(data?.minimumInvestment),
      maximumInvestment: Number(data?.maximumInvestment || 0),
      lockDays: Number(data?.lockDays ?? data?.lockPeriodDays ?? 30),
      lockPeriodDays: Number(data?.lockPeriodDays ?? data?.lockDays ?? 30),
      hasSufficientBalance:
        typeof data?.hasSufficientBalance === 'boolean'
          ? data.hasSufficientBalance
          : true,
      walletBalance: Number(data?.walletBalance || 0),
      totalPayable: Number(data?.totalPayable ?? data?.amount ?? 0),
      currentValue: Number(data?.currentValue || 0),
      indexName: data?.indexName || '',
      indexSymbol: data?.indexSymbol || '',
      slabTitle: data?.slabTitle || '',
      defaultDailyRate:
        data?.defaultDailyRate === null ||
        typeof data?.defaultDailyRate === 'undefined'
          ? null
          : Number(data?.defaultDailyRate),
      slabDailyRate:
        data?.slabDailyRate === null ||
        typeof data?.slabDailyRate === 'undefined'
          ? null
          : Number(data?.slabDailyRate),
      indexSnapshot: data?.indexSnapshot || null,
      raw: data,
    };
  }

  normalizeInvestmentOrder(data = {}) {
    const lockPeriodDays = Number(data?.lockPeriodDays ?? data?.lockDays ?? 30);
    const daysCompleted = Number(data?.daysCompleted ?? 0);
    const daysRemaining =
      typeof data?.daysRemaining === 'number'
        ? data.daysRemaining
        : Math.max(lockPeriodDays - daysCompleted, 0);

    const status = data?.status || 'active';
    const isLockCompleted =
      typeof data?.isLockCompleted === 'boolean'
        ? data.isLockCompleted
        : daysCompleted >= lockPeriodDays;

    const progressPercent =
      Number(
        data?.progressPercent ??
          (lockPeriodDays > 0 ? (daysCompleted / lockPeriodDays) * 100 : 0),
      ) || 0;

    const isUnlockedStatus = status === 'unlocked';

    return {
      _id: data?._id || data?.id || data?.investmentId || null,
      orderNumber: data?.orderNumber || '',
      amount: Number(data?.amount || 0),
      status,
      lockPeriodDays,
      daysCompleted,
      daysRemaining,
      isLockCompleted,
      isLocked:
        typeof data?.isLocked === 'boolean'
          ? data.isLocked
          : status === 'active' && !isLockCompleted,
      isUnlocked:
        typeof data?.isUnlocked === 'boolean'
          ? data.isUnlocked
          : isUnlockedStatus,
      isMatured:
        typeof data?.isMatured === 'boolean'
          ? data.isMatured
          : status === 'active' && isLockCompleted,
      canCancel:
        typeof data?.canCancel === 'boolean'
          ? data.canCancel
          : status === 'active' && isLockCompleted,
      canUnlock:
        typeof data?.canUnlock === 'boolean'
          ? data.canUnlock
          : status === 'active' && isLockCompleted,
      canRenew:
        typeof data?.canRenew === 'boolean' ? data.canRenew : isUnlockedStatus,
      canReinvest:
        typeof data?.canReinvest === 'boolean'
          ? data.canReinvest
          : isUnlockedStatus,
      progressPercent,
      effectiveDailyRate: Number(
        data?.effectiveDailyRate ?? data?.dailyRate ?? data?.rate ?? 0,
      ),
      dailyInterestAmount: Number(
        data?.dailyInterestAmount ??
          data?.dailyEarning ??
          data?.perDayReturn ??
          0,
      ),
      totalInterestEarned: Number(
        data?.totalInterestEarned ?? data?.earned ?? 0,
      ),
      currentValueSnapshot: Number(
        data?.currentValueSnapshot ??
          Number(data?.amount || 0) + Number(data?.totalInterestEarned || 0),
      ),
      createdAt: data?.createdAt || null,
      orderPlacedAt: data?.orderPlacedAt || null,
      approvedAt: data?.approvedAt || null,
      cancelledAt: data?.cancelledAt || null,
      completedAt: data?.completedAt || null,
      unlockedAt: data?.unlockedAt || null,
      lockEndsAt: data?.lockEndsAt || null,
      customDailyRate: data?.customDailyRate ?? null,
      slabDailyRate: data?.slabDailyRate ?? null,
      rateSource: data?.rateSource || '',
      index: data?.index || data?.indexId || null,
      user: data?.user || data?.userId || null,
      indexSnapshot: data?.indexSnapshot || null,
      categorySnapshot: data?.categorySnapshot || null,
      raw: data,
    };
  }

  getInvestmentPreviewEndpoint() {
    return ENDPOINTS.GET_INVESTMENT_PREVIEW || '/market/investments/preview';
  }

  getPlaceInvestmentOrderEndpoint() {
    return ENDPOINTS.PLACE_INVESTMENT_ORDER || '/market/investments/orders';
  }

  getMyOrdersEndpoint() {
    return (
      ENDPOINTS.GET_MY_INVESTMENT_ORDERS || '/market/investments/my-orders'
    );
  }

  getMyPortfolioEndpoint() {
    return ENDPOINTS.GET_MY_PORTFOLIO || '/market/investments/portfolio';
  }

  getCancelInvestmentBaseEndpoint() {
    return ENDPOINTS.CANCEL_INVESTMENT_BASE || '/market/investments';
  }

  getUnlockInvestmentBaseEndpoint() {
    return ENDPOINTS.UNLOCK_INVESTMENT_BASE || '/market/investments';
  }

  getRenewInvestmentBaseEndpoint() {
    return ENDPOINTS.RENEW_INVESTMENT_BASE || '/market/investments';
  }

  getReinvestInvestmentBaseEndpoint() {
    return ENDPOINTS.REINVEST_INVESTMENT_BASE || '/market/investments';
  }

  async sendSignupOTP(fullName, phoneNumber) {
    try {
      const cleanPhone = sanitizePhoneNumber(phoneNumber);

      console.log(`📞 Sending Signup OTP to: ${cleanPhone}`);

      const response = await this.api.post(
        ENDPOINTS.SEND_SIGNUP_OTP,
        {
          fullName: String(fullName || '').trim(),
          phoneNumber: cleanPhone,
        },
        { _noRetry: true },
      );

      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message || 'OTP sent successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async verifySignupOTP(fullName, phoneNumber, otp, referralCode = '') {
    try {
      const cleanPhone = sanitizePhoneNumber(phoneNumber);
      const cleanOtp = sanitizeOTP(otp);
      const cleanReferralCode = String(referralCode || '')
        .trim()
        .toUpperCase();

      const payload = {
        fullName: String(fullName || '').trim(),
        phoneNumber: cleanPhone,
        otp: cleanOtp,
      };

      if (cleanReferralCode) {
        payload.referralCode = cleanReferralCode;
      }

      const response = await this.api.post(
        ENDPOINTS.VERIFY_SIGNUP_OTP,
        payload,
        { _noRetry: true },
      );

      const responseData = response.data?.data;

      if (responseData?.token) {
        await AuthStorage.saveToken(responseData.token);
        await AuthStorage.saveUser(responseData.user);
        this.clearUserScopedCache();
      }

      return {
        success: true,
        data: responseData,
        message: response.data?.message || 'Signup successful',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async resendSignupOTP(fullName, phoneNumber) {
    try {
      const cleanPhone = sanitizePhoneNumber(phoneNumber);
      console.log(`🔄 Resending Signup OTP to: ${cleanPhone}`);
      const response = await this.api.post(
        ENDPOINTS.RESEND_SIGNUP_OTP,
        {
          fullName: fullName.trim(),
          phoneNumber: cleanPhone,
        },
        { _noRetry: true },
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'OTP resent successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async sendLoginOTP(phoneNumber) {
    try {
      const cleanPhone = sanitizePhoneNumber(phoneNumber);
      console.log(`📞 Sending Login OTP to: ${cleanPhone}`);
      const response = await this.api.post(
        ENDPOINTS.SEND_LOGIN_OTP,
        {
          phoneNumber: cleanPhone,
        },
        { _noRetry: true },
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'OTP sent successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async verifyLoginOTP(phoneNumber, otp) {
    try {
      const cleanPhone = sanitizePhoneNumber(phoneNumber);
      const cleanOtp = sanitizeOTP(otp);
      console.log(`🔐 Verifying Login OTP for: ${cleanPhone}`);

      const response = await this.api.post(
        ENDPOINTS.VERIFY_LOGIN_OTP,
        {
          phoneNumber: cleanPhone,
          otp: cleanOtp,
        },
        { _noRetry: true },
      );

      if (response.data.data?.token) {
        await AuthStorage.saveToken(response.data.data.token);
        await AuthStorage.saveUser(response.data.data.user);
        this.clearUserScopedCache();
      }

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Login successful',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async resendLoginOTP(phoneNumber) {
    try {
      const cleanPhone = sanitizePhoneNumber(phoneNumber);
      console.log(`🔄 Resending Login OTP to: ${cleanPhone}`);
      const response = await this.api.post(
        ENDPOINTS.RESEND_LOGIN_OTP,
        {
          phoneNumber: cleanPhone,
        },
        { _noRetry: true },
      );

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'OTP resent successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async logout() {
    try {
      await AuthStorage.clearAuth();
      this.clearUserScopedCache();
      console.log('🚪 User logged out successfully');
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      return { success: false, message: 'Error during logout' };
    }
  }

  async getUserProfile(options = {}) {
    try {
      console.log('👤 Fetching user profile');

      const result = await this.cacheFirstRequest({
        cacheKey: 'profile',
        ttl: CACHE_TTL.profile,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () => this.api.get(ENDPOINTS.GET_USER_PROFILE),
        transform: async response => {
          const user = response.data?.data?.user || response.data?.data || null;
          if (user) {
            await AuthStorage.saveUser(user);
          }
          return user;
        },
      });

      if (result.data && typeof result.data?.then === 'function') {
        result.data = await result.data;
      }

      return {
        ...result,
        message: 'Profile fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getBankAccounts(options = {}) {
    try {
      console.log('🏦 Fetching bank accounts');

      const result = await this.cacheFirstRequest({
        cacheKey: 'bankAccounts',
        ttl: CACHE_TTL.bankAccounts,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () => this.api.get(ENDPOINTS.GET_BANK_ACCOUNTS),
        transform: response => response.data?.data || [],
      });

      return {
        ...result,
        message: 'Bank accounts fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async addBankAccount(bankData) {
    try {
      console.log(`➕ Adding bank account: ${bankData.bankName}`);
      const response = await this.api.post(
        ENDPOINTS.ADD_BANK_ACCOUNT,
        {
          bankName: bankData.bankName.trim(),
          accountHolderName: bankData.accountHolderName.trim(),
          accountNumber: bankData.accountNumber.trim(),
          ifscCode: bankData.ifscCode.toUpperCase().trim(),
          accountType: bankData.accountType || 'Savings',
          isPrimary: bankData.isPrimary || false,
        },
        { _noRetry: true },
      );

      this.invalidateCache(['bankAccounts']);

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Bank account added successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteBankAccount(accountId) {
    try {
      console.log(`🗑️ Deleting bank account: ${accountId}`);
      const response = await this.api.delete(
        `${ENDPOINTS.DELETE_BANK_ACCOUNT}/${accountId}`,
        { _noRetry: true },
      );

      this.invalidateCache(['bankAccounts']);

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Bank account deleted successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async setPrimaryBankAccount(accountId) {
    try {
      console.log(`⭐ Setting primary account: ${accountId}`);
      const response = await this.api.patch(
        `${ENDPOINTS.SET_PRIMARY_BANK}/${accountId}/primary`,
        null,
        { _noRetry: true },
      );

      this.invalidateCache(['bankAccounts']);

      return {
        success: true,
        data: response.data.data,
        message:
          response.data.message || 'Primary account updated successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getWalletBalance(options = {}) {
    try {
      console.log('💰 Fetching wallet balance');

      const result = await this.cacheFirstRequest({
        cacheKey: 'wallet',
        ttl: CACHE_TTL.wallet,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () => this.api.get(ENDPOINTS.GET_WALLET_BALANCE),
        transform: response => response.data?.data || null,
      });

      return {
        ...result,
        message: 'Balance fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async addMoney(amount, utrNumber, gateway, paymentMethod = 'UPI') {
    try {
      console.log(`💵 Adding money: ₹${amount}, UTR: ${utrNumber}`);
      const response = await this.api.post(
        ENDPOINTS.ADD_MONEY,
        {
          amount: parseFloat(amount),
          utrNumber: utrNumber.trim(),
          gateway: gateway.trim(),
          paymentMethod: paymentMethod.trim(),
        },
        { _noRetry: true },
      );

      this.invalidateCache(['wallet', 'transactions']);

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Payment submitted successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async withdrawMoney(amount, bankDetails) {
    try {
      console.log(`🏦 Withdrawing: ₹${amount}`);
      const response = await this.api.post(
        ENDPOINTS.WITHDRAW_MONEY,
        {
          amount: parseFloat(amount),
          accountNumber: bankDetails.accountNumber.trim(),
          ifscCode: bankDetails.ifscCode.toUpperCase().trim(),
          accountHolderName: bankDetails.accountHolderName.trim(),
          bankName: bankDetails.bankName.trim(),
        },
        { _noRetry: true },
      );

      this.invalidateCache(['wallet', 'transactions']);

      return {
        success: true,
        data: response.data.data,
        message:
          response.data.message || 'Withdrawal request submitted successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getPaymentConfig(options = {}) {
    try {
      console.log('💳 Fetching payment config');

      const result = await this.cacheFirstRequest({
        cacheKey: 'paymentConfig',
        ttl: CACHE_TTL.paymentConfig,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () =>
          this.api.get(ENDPOINTS.GET_PAYMENT_CONFIG || '/payment/config'),
        transform: response => response.data?.data || response.data || null,
      });

      return {
        ...result,
        message: 'Payment config fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async submitPayment({ amount, utrNumber, paymentMethod, gateway }) {
    try {
      console.log(`💸 Submitting payment: ₹${amount}, UTR: ${utrNumber}`);
      const response = await this.api.post(
        ENDPOINTS.ADD_MONEY || '/payments',
        {
          amount: parseFloat(amount),
          utrNumber: utrNumber.trim(),
          paymentMethod: paymentMethod.trim(),
          gateway: gateway.trim(),
        },
        { _noRetry: true },
      );

      this.invalidateCache(['wallet', 'transactions']);

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Payment submitted successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getBanners(options = {}) {
    try {
      console.log('🖼️ Fetching public banners');

      const result = await this.cacheFirstRequest({
        cacheKey: 'banners',
        ttl: CACHE_TTL.banners,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () => this.api.get(ENDPOINTS.GET_BANNERS_PUBLIC),
        transform: response => response.data?.data?.banners || [],
      });

      return {
        ...result,
        message: 'Banners fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getFeaturedIndices(options = {}) {
    try {
      console.log('📈 Fetching featured indices');

      const result = await this.cacheFirstRequest({
        cacheKey: 'featuredIndices',
        ttl: CACHE_TTL.featuredIndices,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () => this.api.get(ENDPOINTS.GET_FEATURED_INDICES),
        transform: response => {
          const indices =
            response.data?.data?.indices || response.data?.data || [];
          return Array.isArray(indices)
            ? indices.map(item => this.normalizeMarketIndex(item))
            : [];
        },
      });

      return {
        ...result,
        message: 'Featured indices fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getMarketIndices(params = {}, options = {}) {
    try {
      console.log('📊 Fetching market indices');

      const result = await this.cacheFirstRequest({
        cacheKey: 'marketIndices',
        cacheParams: params,
        ttl: CACHE_TTL.marketIndices,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () => this.api.get(ENDPOINTS.GET_MARKET_INDICES, { params }),
        transform: response => {
          const indices =
            response.data?.data?.indices || response.data?.data || [];
          return {
            items: Array.isArray(indices)
              ? indices.map(item => this.normalizeMarketIndex(item))
              : [],
            pagination: {
              total: response.data?.data?.total || 0,
              totalPages: response.data?.data?.totalPages || 1,
              currentPage: response.data?.data?.currentPage || 1,
            },
          };
        },
      });

      return {
        success: true,
        data: result.data?.items || [],
        pagination: result.data?.pagination || {
          total: 0,
          totalPages: 1,
          currentPage: 1,
        },
        fromCache: result.fromCache,
        stale: result.stale,
        cachedAt: result.cachedAt,
        message: 'Market indices fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAllIndices(params = {}, options = {}) {
    try {
      console.log('📊 Fetching all indices');

      const result = await this.cacheFirstRequest({
        cacheKey: 'allIndices',
        cacheParams: params,
        ttl: CACHE_TTL.allIndices,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () => this.api.get(ENDPOINTS.GET_ALL_INDICES, { params }),
        transform: response => {
          const indices = response.data?.data?.indices || [];
          return {
            items: Array.isArray(indices)
              ? indices.map(item => this.normalizeMarketIndex(item))
              : [],
            pagination: {
              total: response.data?.data?.total || 0,
              totalPages: response.data?.data?.totalPages || 1,
              currentPage: response.data?.data?.currentPage || 1,
            },
          };
        },
      });

      return {
        success: true,
        data: result.data?.items || [],
        pagination: result.data?.pagination || {
          total: 0,
          totalPages: 1,
          currentPage: 1,
        },
        fromCache: result.fromCache,
        stale: result.stale,
        cachedAt: result.cachedAt,
        message: 'Indices fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getActiveMarketCategories(options = {}) {
    try {
      console.log('📂 Fetching active market categories');

      const result = await this.cacheFirstRequest({
        cacheKey: 'categories',
        ttl: CACHE_TTL.categories,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () => this.api.get(ENDPOINTS.GET_ACTIVE_MARKET_CATEGORIES),
        transform: response => {
          const categories =
            response.data?.data?.categories || response.data?.data || [];
          return Array.isArray(categories) ? categories : [];
        },
      });

      return {
        ...result,
        message: 'Market categories fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getTransactions(page = 1, limit = 20, filters = {}, options = {}) {
    try {
      console.log(`📜 Fetching transactions (page ${page})`);

      const params = {
        page: page.toString(),
        limit: limit.toString(),
        ...filters,
      };

      const result = await this.cacheFirstRequest({
        cacheKey: 'transactions',
        cacheParams: params,
        ttl: CACHE_TTL.transactions,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () => this.api.get(ENDPOINTS.GET_TRANSACTIONS, { params }),
        transform: response => ({
          items: response.data?.data?.transactions || [],
          pagination: {
            totalPages: response.data?.data?.totalPages || 0,
            currentPage: response.data?.data?.currentPage || 1,
            totalTransactions: response.data?.data?.totalTransactions || 0,
          },
        }),
      });

      return {
        success: true,
        data: result.data?.items || [],
        pagination: result.data?.pagination || {
          totalPages: 0,
          currentPage: 1,
          totalTransactions: 0,
        },
        fromCache: result.fromCache,
        stale: result.stale,
        cachedAt: result.cachedAt,
        message: 'Transactions fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getAllTransactions(filters = {}, options = {}) {
    try {
      console.log('📜 Fetching ALL transactions (no limit)');

      const params = { ...filters };

      const result = await this.cacheFirstRequest({
        cacheKey: 'transactions',
        cacheParams: params,
        ttl: CACHE_TTL.transactions,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () => this.api.get(ENDPOINTS.GET_TRANSACTIONS, { params }),
        transform: response => {
          const responseData = response.data?.data || {};
          const transactions =
            responseData.transactions ||
            responseData.items ||
            responseData.records ||
            (Array.isArray(responseData) ? responseData : []);

          return {
            items: Array.isArray(transactions) ? transactions : [],
            totalTransactions: Number(
              responseData.totalTransactions ||
                responseData.total ||
                transactions.length,
            ),
          };
        },
      });

      return {
        success: true,
        data: result.data?.items || [],
        totalTransactions: result.data?.totalTransactions || 0,
        fromCache: result.fromCache,
        stale: result.stale,
        cachedAt: result.cachedAt,
        message: 'All transactions fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getMarketIndexDetails(indexId, options = {}) {
    try {
      if (!indexId) {
        throw new Error('Index id is required');
      }

      console.log('Fetching market index details for id', indexId);

      const result = await this.cacheFirstRequest({
        cacheKey: 'indexDetails',
        cacheParams: { indexId },
        ttl: CACHE_TTL.indexDetails,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () =>
          this.api.get(
            `${ENDPOINTS.GET_MARKET_INDEX_DETAILS_BY_ID}/${indexId}`,
          ),
        transform: response => this.normalizeMarketIndex(response.data?.data),
      });

      return {
        ...result,
        message: 'Index fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getIndexById(indexId, options = {}) {
    return this.getMarketIndexDetails(indexId, options);
  }

  async getIndexBySymbol(symbol, options = {}) {
    try {
      if (!symbol) {
        throw new Error('Symbol is required');
      }

      console.log('Fetching market index details for symbol', symbol);

      const result = await this.cacheFirstRequest({
        cacheKey: 'indexDetailsBySymbol',
        cacheParams: { symbol },
        ttl: CACHE_TTL.indexDetails,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () =>
          this.api.get(`${ENDPOINTS.GET_MARKET_INDEX_DETAILS}/${symbol}`),
        transform: response => this.normalizeMarketIndex(response.data?.data),
      });

      return {
        ...result,
        message: 'Index fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getStockDetails(indexId, options = {}) {
    return this.getMarketIndexDetails(indexId, options);
  }

  async getMarketIndexHistory(symbol, period = '1D', options = {}) {
    try {
      console.log(
        `📈 Fetching market index history for: ${symbol}, period: ${period}`,
      );

      const result = await this.cacheFirstRequest({
        cacheKey: 'indexHistory',
        cacheParams: { symbol, period },
        ttl: CACHE_TTL.indexHistory,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () =>
          this.api.get(ENDPOINTS.GET_MARKET_INDEX_HISTORY, {
            params: { ticker: symbol, period, type: 'Index' },
          }),
        transform: response => ({
          items: response.data?.data?.history?.data || [],
          raw: response.data?.data?.history || null,
        }),
      });

      return {
        success: true,
        data: result.data?.items || [],
        raw: result.data?.raw || null,
        fromCache: result.fromCache,
        stale: result.stale,
        cachedAt: result.cachedAt,
        message: 'Price history fetched successfully',
      };
    } catch (error) {
      if (error?.response?.status === 404) {
        return {
          success: true,
          data: [],
          raw: null,
          message: 'Price history not found',
        };
      }
      return this.handleError(error);
    }
  }

  async getMarketIndexDailyHistory(symbol, page = 1, limit = 10, options = {}) {
    try {
      console.log(`📅 Fetching market index daily history for: ${symbol}`);

      const params = { page, limit };

      const result = await this.cacheFirstRequest({
        cacheKey: 'indexDailyHistory',
        cacheParams: { symbol, ...params },
        ttl: CACHE_TTL.indexDailyHistory,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () =>
          this.api.get(
            `${ENDPOINTS.GET_MARKET_INDEX_DAILY_HISTORY}/${symbol}`,
            { params },
          ),
        transform: response => ({
          items: response.data?.data?.history || [],
          raw: response.data?.data || null,
        }),
      });

      return {
        success: true,
        data: result.data?.items || [],
        raw: result.data?.raw || null,
        fromCache: result.fromCache,
        stale: result.stale,
        cachedAt: result.cachedAt,
        message: 'Daily history fetched successfully',
      };
    } catch (error) {
      if (error?.response?.status === 404) {
        return {
          success: true,
          data: [],
          raw: null,
          message: 'Daily history not found',
        };
      }
      return this.handleError(error);
    }
  }

  async getMarketInvestmentInfo(symbol, options = {}) {
    try {
      console.log(`💰 Fetching market investment info for: ${symbol}`);

      const result = await this.cacheFirstRequest({
        cacheKey: 'investmentInfo',
        cacheParams: { symbol },
        ttl: CACHE_TTL.investmentInfo,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () =>
          this.api.get(
            `${ENDPOINTS.GET_MARKET_INVESTMENT_INFO}/${symbol}/investment-info`,
          ),
        transform: response => response.data?.data || null,
      });

      return {
        ...result,
        message: 'Investment info fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async unlockInvestment(investmentId) {
    try {
      if (!investmentId) throw new Error('Investment id is required');
      const baseEndpoint = this.getUnlockInvestmentBaseEndpoint();
      console.log(`🔓 Unlocking investment: ${investmentId}`);

      const response = await this.api.post(
        `${baseEndpoint}/${investmentId}/unlock`,
        {},
        { _noRetry: true },
      );

      this.invalidateCache(['myOrders', 'portfolio', 'wallet', 'transactions']);

      return {
        success: true,
        data: this.normalizeInvestmentOrder(response.data?.data || {}),
        message: response.data?.message || 'Investment unlocked successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async renewInvestment(investmentId) {
    try {
      if (!investmentId) throw new Error('Investment id is required');
      const baseEndpoint = this.getRenewInvestmentBaseEndpoint();
      console.log(`🔁 Renewing investment: ${investmentId}`);

      const response = await this.api.post(
        `${baseEndpoint}/${investmentId}/renew`,
        {},
        { _noRetry: true },
      );

      this.invalidateCache(['myOrders', 'portfolio', 'wallet', 'transactions']);

      return {
        success: true,
        data: this.normalizeInvestmentOrder(response.data?.data || {}),
        message: response.data?.message || 'Investment renewed successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async reinvestInvestment(investmentId, payload = {}) {
    try {
      if (!investmentId) throw new Error('Investment id is required');
      const baseEndpoint = this.getReinvestInvestmentBaseEndpoint();
      console.log(`💹 Reinvesting from investment: ${investmentId}`);

      const response = await this.api.post(
        `${baseEndpoint}/${investmentId}/reinvest`,
        {
          indexId: payload?.indexId,
          amount: payload?.amount ? parseFloat(payload.amount) : undefined,
          customDailyRate: payload?.customDailyRate ?? undefined,
        },
        { _noRetry: true },
      );

      this.invalidateCache(['myOrders', 'portfolio', 'wallet', 'transactions']);

      return {
        success: true,
        data: this.normalizeInvestmentOrder(response.data?.data || {}),
        message: response.data?.message || 'Reinvestment successful',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getInvestmentPreview({ indexId, amount }) {
    try {
      const endpoint = this.getInvestmentPreviewEndpoint();
      console.log(
        `🧮 Fetching investment preview: index=${indexId}, amount=${amount}`,
      );

      const response = await this.api.post(
        endpoint,
        {
          indexId,
          amount: parseFloat(amount),
        },
        { _noRetry: true },
      );

      return {
        success: true,
        data: this.normalizeInvestmentPreview(response.data?.data || {}),
        message:
          response.data?.message || 'Investment preview fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async previewInvestmentOrder(payload) {
    return this.getInvestmentPreview(payload);
  }

  async previewOrder(payload) {
    return this.getInvestmentPreview(payload);
  }

  async placeInvestmentOrder(payload) {
    try {
      const endpoint = this.getPlaceInvestmentOrderEndpoint();
      console.log(
        `🛒 Placing investment order: index=${payload?.indexId}, amount=${payload?.amount}`,
      );

      const response = await this.api.post(
        endpoint,
        {
          indexId: payload?.indexId,
          amount: parseFloat(payload?.amount),
        },
        { _noRetry: true },
      );

      const responseData = response.data?.data || {};
      const order =
        responseData?.order || responseData?.investment || responseData;

      this.invalidateCache(['myOrders', 'portfolio', 'wallet', 'transactions']);

      return {
        success: true,
        data: {
          ...responseData,
          order: this.normalizeInvestmentOrder(order),
        },
        message: response.data?.message || 'Investment placed successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async createInvestmentOrder(payload) {
    return this.placeInvestmentOrder(payload);
  }

  async placeOrder(payload) {
    return this.placeInvestmentOrder(payload);
  }

  async getMyInvestmentOrders(params = {}, options = {}) {
    try {
      const endpoint = this.getMyOrdersEndpoint();
      console.log('📁 Fetching my investment orders');

      const result = await this.cacheFirstRequest({
        cacheKey: 'myOrders',
        cacheParams: params,
        ttl: CACHE_TTL.myOrders,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () => this.api.get(endpoint, { params }),
        transform: response => {
          const list =
            response.data?.data?.investments ||
            response.data?.data?.orders ||
            response.data?.data?.items ||
            response.data?.data ||
            [];

          return {
            items: Array.isArray(list)
              ? list.map(item => this.normalizeInvestmentOrder(item))
              : [],
            pagination: {
              total: response.data?.data?.total || 0,
              totalPages: response.data?.data?.totalPages || 1,
              currentPage: response.data?.data?.currentPage || 1,
            },
          };
        },
      });

      return {
        success: true,
        data: result.data?.items || [],
        pagination: result.data?.pagination || {
          total: 0,
          totalPages: 1,
          currentPage: 1,
        },
        fromCache: result.fromCache,
        stale: result.stale,
        cachedAt: result.cachedAt,
        message: 'Investment orders fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getMyPortfolio(params = {}, options = {}) {
    try {
      const endpoint = this.getMyPortfolioEndpoint();
      console.log('📁 Fetching my portfolio');

      const result = await this.cacheFirstRequest({
        cacheKey: 'portfolio',
        cacheParams: params,
        ttl: CACHE_TTL.portfolio,
        preferCache: options.preferCache ?? true,
        backgroundRefresh: options.backgroundRefresh ?? true,
        requestFn: () => this.api.get(endpoint, { params }),
        transform: response => {
          const list =
            response.data?.data?.investments ||
            response.data?.data?.portfolio ||
            response.data?.data?.items ||
            response.data?.data ||
            [];

          return {
            items: Array.isArray(list)
              ? list.map(item => this.normalizeInvestmentOrder(item))
              : [],
            pagination: {
              total: response.data?.data?.total || 0,
              totalPages: response.data?.data?.totalPages || 1,
              currentPage: response.data?.data?.currentPage || 1,
            },
          };
        },
      });

      return {
        success: true,
        data: result.data?.items || [],
        pagination: result.data?.pagination || {
          total: 0,
          totalPages: 1,
          currentPage: 1,
        },
        fromCache: result.fromCache,
        stale: result.stale,
        cachedAt: result.cachedAt,
        message: 'Portfolio fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getMyInvestments(params = {}, options = {}) {
    return this.getMyPortfolio(params, options);
  }

  async cancelInvestment(investmentId) {
    try {
      if (!investmentId) throw new Error('Investment id is required');
      const baseEndpoint = this.getCancelInvestmentBaseEndpoint();
      console.log(`🛑 Cancelling investment: ${investmentId}`);

      const response = await this.api.post(
        `${baseEndpoint}/${investmentId}/cancel`,
        {},
        { _noRetry: true },
      );

      this.invalidateCache(['myOrders', 'portfolio', 'wallet', 'transactions']);

      return {
        success: true,
        data: this.normalizeInvestmentOrder(response.data?.data || {}),
        message: response.data?.message || 'Investment cancelled successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async saveFcmToken(fcmToken) {
    try {
      console.log('📲 Saving FCM token to backend');
      const response = await this.api.put(
        '/user/fcm-token',
        { fcmToken },
        { noRetry: true },
      );

      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message || 'FCM token saved successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getUserNotifications() {
    try {
      const response = await this.api.get(
        ENDPOINTS.GET_USER_NOTIFICATIONS || '/notifications/user',
      );
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Notifications fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const response = await this.api.patch(
        `${
          ENDPOINTS.MARK_NOTIFICATION_AS_READ || '/notifications/user'
        }/${notificationId}/read`,
      );
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Notification marked as read',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async markNotificationAsClicked(notificationId) {
    try {
      const response = await this.api.patch(
        `${
          ENDPOINTS.MARK_NOTIFICATION_AS_CLICKED || '/notifications/user'
        }/${notificationId}/click`,
      );
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Notification marked as clicked',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getMyReferralInfo() {
    try {
      console.log('🎁 Fetching referral info');

      const response = await this.api.get(ENDPOINTS.GET_MY_REFERRAL_INFO);

      return {
        success: true,
        data: response.data?.data,
        message: response.data?.message || 'Referral info fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getMyReferralHistory(page = 1, limit = 20) {
    try {
      console.log('🎁 Fetching referral history');

      const response = await this.api.get(ENDPOINTS.GET_MY_REFERRAL_HISTORY, {
        params: {
          page,
          limit,
        },
      });

      return {
        success: true,
        data: response.data?.data,
        message:
          response.data?.message || 'Referral history fetched successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async get(endpoint, config = {}) {
    return this.api.get(endpoint, config);
  }

  async post(endpoint, data = {}, config = {}) {
    const isFormData =
      typeof FormData !== 'undefined' && data instanceof FormData;

    const requestConfig = {
      ...config,
      headers: {
        ...(config.headers || {}),
      },
    };

    if (isFormData) {
      requestConfig.headers['Content-Type'] = 'multipart/form-data';
    }

    return this.api.post(endpoint, data, requestConfig);
  }
}

export default new ApiService();
