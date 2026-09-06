import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  approvePayment,
  rejectPayment
} from '../../store/slices/paymentsSlice';
import { Check, X, Clock, Phone, User, Wallet, Calendar, Hash, Building2, Eye, XCircle } from 'lucide-react';

const PendingPayments = () => {
  const dispatch = useDispatch();
  const { payments, actionLoading } = useSelector((state) => state.payments);

  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // ❌ REMOVED: No fetching here - parent handles it

  const handleApprove = async (transactionId) => {
    if (!window.confirm('Are you sure you want to approve this payment?')) return;

    const result = await dispatch(approvePayment({
      transactionId,
      verificationNote: 'Payment verified and approved'
    }));

    if (approvePayment.fulfilled.match(result)) {
      alert('Payment approved successfully!');
    } else {
      alert('Error: ' + result.payload);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please enter rejection reason');
      return;
    }

    const result = await dispatch(rejectPayment({
      transactionId: rejectModal,
      reason: rejectReason
    }));

    if (rejectPayment.fulfilled.match(result)) {
      alert('Payment rejected!');
      setRejectModal(null);
      setRejectReason('');
    } else {
      alert('Error: ' + result.payload);
    }
  };

  // ❌ REMOVED: No loading state here

  if (!payments || payments.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-16 text-center border border-blue-100">
        <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Wallet className="text-blue-500" size={40} />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">All Clear!</h3>
        <p className="text-gray-600 text-lg">No pending payment requests at the moment.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {payments.map((payment) => (
          <div
            key={payment._id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-xl">
                    <User className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {payment.userId?.fullName}
                    </h3>
                    <div className="flex items-center text-blue-100 text-sm mt-1">
                      <Phone size={14} className="mr-1.5" />
                      {payment.userId?.phoneNumber}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-xs font-medium mb-1">Amount</p>
                  <p className="text-3xl font-bold text-white">
                    ₹{payment.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <div className="grid grid-cols-3 gap-4 mb-5">
                {/* Payment Gateway */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center text-gray-500 text-xs mb-1.5">
                    <Building2 size={14} className="mr-1" />
                    Gateway
                  </div>
                  <p className="font-bold text-gray-800 text-sm">
                    {payment.paymentDetails?.gateway || 'N/A'}
                  </p>
                </div>

                {/* UTR Number */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center text-gray-500 text-xs mb-1.5">
                    <Hash size={14} className="mr-1" />
                    UTR Number
                  </div>
                  <p className="font-mono font-bold text-gray-800 text-xs">
                    {payment.paymentDetails?.utrNumber || 'N/A'}
                  </p>
                </div>

                {/* Date */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center text-gray-500 text-xs mb-1.5">
                    <Calendar size={14} className="mr-1" />
                    Request Date
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="bg-yellow-100 px-4 py-2 rounded-lg flex items-center">
                    <Clock size={16} className="text-yellow-600 mr-2" />
                    <span className="text-sm font-semibold text-yellow-700">Pending Review</span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  {payment.paymentDetails?.screenshotUrl && (
                    <a
                      href={payment.paymentDetails.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg flex items-center space-x-2 transition-all font-medium text-sm"
                    >
                      <Eye size={18} />
                      <span>View</span>
                    </a>
                  )}
                  <button
                    onClick={() => handleApprove(payment._id)}
                    disabled={actionLoading === payment._id}
                    className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-medium text-sm"
                  >
                    <Check size={18} />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => setRejectModal(payment._id)}
                    disabled={actionLoading === payment._id}
                    className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-medium text-sm"
                  >
                    <X size={18} />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal - Professional Design */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <XCircle className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Reject Payment</h3>
                </div>
                <button
                  onClick={() => {
                    setRejectModal(null);
                    setRejectReason('');
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-gray-600 mb-4 text-sm">
                Please provide a detailed reason for rejecting this payment request:
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl px-4 py-3 mb-6 transition-all outline-none resize-none"
                rows="5"
                placeholder="e.g., Invalid UTR number, Payment not received, Screenshot mismatch..."
              ></textarea>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => {
                    setRejectModal(null);
                    setRejectReason('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingPayments;
