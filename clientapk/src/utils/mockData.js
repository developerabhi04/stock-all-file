export const MOCK_USERS = [
    {
        phoneNumber: '+11234567890',
        name: 'John Doe',
        isRegistered: true,
    },
    {
        phoneNumber: '+19876543210',
        name: 'Jane Smith',
        isRegistered: true,
    },
];

export const MOCK_OTP = '123456';

export const getMockUser = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return MOCK_USERS.find(user => user.phoneNumber.replace(/\D/g, '') === cleaned);
};

// Mock stock data
export const MOCK_STOCKS = [
    { id: '1', name: 'Reliance Industries', ticker: 'RELIANCE', price: '2,456.75', change: '+2.34%', isPositive: true },
    { id: '2', name: 'TCS Ltd', ticker: 'TCS', price: '3,542.20', change: '+1.85%', isPositive: true },
    { id: '3', name: 'HDFC Bank', ticker: 'HDFCBANK', price: '1,678.90', change: '-0.45%', isPositive: false },
    { id: '4', name: 'Infosys', ticker: 'INFY', price: '1,523.45', change: '+3.12%', isPositive: true },
    { id: '5', name: 'ICICI Bank', ticker: 'ICICIBANK', price: '945.60', change: '+1.28%', isPositive: true },
    { id: '6', name: 'Bharti Airtel', ticker: 'BHARTIARTL', price: '876.30', change: '-1.15%', isPositive: false },
    { id: '7', name: 'State Bank of India', ticker: 'SBIN', price: '567.85', change: '+2.67%', isPositive: true },
    { id: '8', name: 'Adani Enterprises', ticker: 'ADANIENT', price: '2,234.50', change: '+4.23%', isPositive: true },
    { id: '9', name: 'ITC Ltd', ticker: 'ITC', price: '412.75', change: '-0.82%', isPositive: false },
    { id: '10', name: 'Wipro', ticker: 'WIPRO', price: '445.20', change: '+1.95%', isPositive: true },
];
