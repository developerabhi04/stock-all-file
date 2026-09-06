const PageHeader = ({ title, subtitle }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {title}
            </h1>
            <p className="text-gray-600 text-sm">
                {subtitle}
            </p>
        </div>
    );
};

export default PageHeader;
