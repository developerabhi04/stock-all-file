const StatCard = ({ title, value, icon: Icon, gradient, bgGradient }) => {
    return (
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${bgGradient} p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${gradient} shadow-md`}>
                    <Icon className="text-white" size={24} />
                </div>
            </div>
            <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                    {title}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                    {value}
                </p>
            </div>
        </div>
    );
};

export default StatCard;
