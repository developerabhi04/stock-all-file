import { Loader } from 'lucide-react';

const Loading = ({ message = 'Loading...', size = 48, fullScreen = true }) => {
    if (fullScreen) {
        return (
            <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <Loader className="animate-spin text-blue-500 mx-auto mb-4" size={size} />
                <p className="text-gray-600">{message}</p>
            </div>
        </div>
        );
    }



    // Inline loader (for smaller sections)
    return (
        // <div className="flex flex-col items-center justify-center py-12">
        //     <Loader className="animate-spin text-blue-500 mb-3" size={size} />
        //     <p className="text-gray-600 text-sm"></p>
        // </div>

        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <Loader className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
                <p className="text-gray-600">{message}</p>
            </div>
        </div>
    );
};

export default Loading;
