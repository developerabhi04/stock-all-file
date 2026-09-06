import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const navigate = (name, params) => {
    if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
    }
};

export const handleNotificationNavigation = (data = {}) => {
    const type = data?.type;

    if (type === 'payment' || type === 'withdrawal') {
        navigate('TransactionHistory');
        return;
    }

    navigate('Notification');
};