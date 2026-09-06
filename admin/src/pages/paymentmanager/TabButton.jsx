const TabButton = ({ tab, isActive, onClick }) => {
    const Icon = tab.icon;

    return (
        <button
            onClick={onClick}
            className={`relative flex items-center space-x-3 px-6 py-4 font-medium transition-all duration-200 ${isActive
                    ? 'text-blue-600 bg-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
        >
            {/* Active indicator */}
            {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}

            {/* Icon */}
            <div className={`p-2 rounded-lg ${isActive
                    ? 'bg-blue-100'
                    : 'bg-gray-100'
                }`}>
                <Icon className={isActive ? 'text-blue-600' : 'text-gray-600'} size={18} />
            </div>

            {/* Label */}
            <span className="text-sm">{tab.label}</span>

            {/* Count Badge */}
            {tab.count > 0 && (
                <span className={`min-w-[20px] h-5 flex items-center justify-center px-2 rounded-full text-xs font-semibold ${isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                    {tab.count}
                </span>
            )}
        </button>
    );
};

export default TabButton;
