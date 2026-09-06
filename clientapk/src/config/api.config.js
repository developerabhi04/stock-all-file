export const SERVER_URL = 'https://ai-index-server.onrender.com';

export const API_CONFIG = {
  BASE_URL: `${SERVER_URL}/api/v1`,
  TIMEOUT: 10000,
};

export const ENDPOINTS = {
  // ==================== AUTH ENDPOINTS ====================
  SEND_LOGIN_OTP: '/auth/login/send-otp',
  VERIFY_LOGIN_OTP: '/auth/login/verify-otp',
  RESEND_LOGIN_OTP: '/auth/login/resend-otp',

  // ==================== SIGNUP ENDPOINTS ====================
  SEND_SIGNUP_OTP: '/auth/signup/send-otp',
  VERIFY_SIGNUP_OTP: '/auth/signup/verify-otp',
  RESEND_SIGNUP_OTP: '/auth/signup/resend-otp',

  // ==================== USER PROFILE ====================
  GET_USER_PROFILE: '/user/profile',
  UPDATE_USER_PROFILE: '/user/profile',
  CHECK_PHONE_EXISTS: '/user/check-phone',

  // ==================== WALLET ====================
  GET_WALLET_BALANCE: '/wallet/balance',
  ADD_MONEY: '/wallet/add-money',
  WITHDRAW_MONEY: '/wallet/withdraw',
  GET_TRANSACTIONS: '/wallet/transactions',

  // ==================== BANK ACCOUNT ====================
  GET_BANK_ACCOUNTS: '/user/bank-accounts',
  ADD_BANK_ACCOUNT: '/user/bank-accounts',
  DELETE_BANK_ACCOUNT: '/user/bank-accounts',
  SET_PRIMARY_BANK: '/user/bank-accounts',

  // ==================== KYC ====================
  UPDATE_BANK_DETAILS: '/auth/bank-details',
  UPDATE_PAN_CARD: '/auth/pan-card',

  // ==================== BANNERS ====================
  GET_BANNERS_PUBLIC: '/banners/public',

  // ==================== MARKET ====================
  GET_MARKET_INDICES: '/market/indices',
  GET_ALL_INDICES: '/market/indices',
  GET_FEATURED_INDICES: '/market/indices/featured',
  GET_ACTIVE_MARKET_CATEGORIES: '/market/categories/active',
  GET_MARKET_INDEX_DETAILS: '/market/indices',
  GET_MARKET_INDEX_HISTORY: '/market/price-history',
  GET_MARKET_INDEX_DAILY_HISTORY: '/market/daily-history',

  GET_MARKET_INDEX_DETAILS_BY_ID: '/market/indices/id',

  // ==================== INVESTMENTS ====================
  GET_INVESTMENT_PREVIEW: '/market/investments/preview',
  PLACE_INVESTMENT_ORDER: '/market/investments/orders',
  GET_MY_INVESTMENT_ORDERS: '/market/investments/my-orders',
  GET_MY_PORTFOLIO: '/market/investments/portfolio',
  CANCEL_INVESTMENT_BASE: '/market/investments',
  UNLOCK_INVESTMENT_BASE: '/market/investments',
  RENEW_INVESTMENT_BASE: '/market/investments',
  REINVEST_INVESTMENT_BASE: '/market/investments',
  GET_MARKET_INVESTMENT_INFO: '/market/indices',

  // NOTIFICATIONS
  GET_USER_NOTIFICATIONS: '/notifications/user',
  MARK_NOTIFICATION_AS_READ: '/notifications/user',
  MARK_NOTIFICATION_AS_CLICKED: '/notifications/user',

  // ==================== REFERRAL ====================
  GET_MY_REFERRAL_INFO: '/referral/my-info',
  GET_MY_REFERRAL_HISTORY: '/referral/my-history',

  // ==================== PAYMENT CONFIG ====================
  GET_PAYMENT_CONFIG: '/payment-config/public',

  // ==================== SUPPORT CHAT ====================
  GET_SUPPORT_CONVERSATION: '/support/conversation',
  SUPPORT_CONVERSATION: '/support/conversation',
  SUPPORT_MESSAGES: '/support/messages',
  SUPPORT_MESSAGES_IMAGE: '/support/messages/image',
};

export const PAYMENT_GATEWAYS = {
  PHONEPE: 'PhonePe',
  GOOGLEPAY: 'GooglePay',
  PAYTM: 'Paytm',
  UPI: 'UPI',
};

export const TRANSACTION_CATEGORIES = {
  ADD_MONEY: 'add_money',
  WITHDRAWAL: 'withdrawal',
  TRADE_BUY: 'trade_buy',
  TRADE_SELL: 'trade_sell',
  PROFIT: 'profit',
  LOSS: 'loss',
  REFUND: 'refund',
  DIVIDEND: 'dividend',
  INVESTMENT_ORDER: 'investment_order',
  INVESTMENT_INTEREST: 'investment_interest',
  INVESTMENT_CANCEL: 'investment_cancel',
  INVESTMENT_UNLOCK: 'investment_unlock',
  INVESTMENT_RENEW: 'investment_renew',
  INVESTMENT_REINVEST: 'investment_reinvest',
};

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
};

export const TRANSACTION_LIMITS = {
  MIN_ADD_MONEY: 5000,
  MIN_WITHDRAWAL: 500,
  MAX_ADD_MONEY: 100000,
  MAX_WITHDRAWAL: 50000,
  MIN_INVESTMENT: 5000,
  MAX_INVESTMENT: 500000,
};
