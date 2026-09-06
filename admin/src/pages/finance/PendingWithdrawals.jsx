import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  approveWithdrawal,
  rejectWithdrawal
} from '../../store/slices/withdrawalsSlice';
import { Check, X, Clock, Phone, User, Building, Calendar, CreditCard, Hash, TrendingDown, CheckCircle, XCircle } from 'lucide-react';

const PendingWithdrawals = () => {
  const dispatch = useDispatch();
  const { withdrawals, actionLoading } = useSelector((state) => state.withdrawals);

  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // ❌ REMOVED: No fetching here - parent handles it

  const handleApprove = async () => {
    if (!utrNumber.trim()) {
      alert('Please enter UTR number');
      return;
    }

    const result = await dispatch(approveWithdrawal({
      transactionId: approveModal,
      utrNumber,
      verificationNote: 'Withdrawal approved and processed'
    }));

    if (approveWithdrawal.fulfilled.match(result)) {
      alert('Withdrawal approved successfully!');
      setApproveModal(null);
      setUtrNumber('');
    } else {
      alert('Error: ' + result.payload);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please enter rejection reason');
      return;
    }

    const result = await dispatch(rejectWithdrawal({
      transactionId: rejectModal,
      reason: rejectReason
    }));

    if (rejectWithdrawal.fulfilled.match(result)) {
      alert('Withdrawal rejected and amount refunded!');
      setRejectModal(null);
      setRejectReason('');
    } else {
      alert('Error: ' + result.payload);
    }
  };

  // ❌ REMOVED: No loading state here

  if (!withdrawals || withdrawals.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-16 text-center border border-purple-100">
        <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <TrendingDown className="text-purple-500" size={40} />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">All Settled!</h3>
        <p className="text-gray-600 text-lg">No pending withdrawal requests at the moment.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {withdrawals.map((withdrawal) => (
          <div
            key={withdrawal._id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm p-3 rounded-xl">
                    <User className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {withdrawal.userId?.fullName}
                    </h3>
                    <div className="flex items-center text-purple-100 text-sm mt-1">
                      <Phone size={14} className="mr-1.5" />
                      {withdrawal.userId?.phoneNumber}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-xs font-medium mb-1">Amount</p>
                  <p className="text-3xl font-bold text-white">
                    ₹{withdrawal.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              {/* Bank Details Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-5 border border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <Building size={18} className="text-purple-600" />
                  </div>
                  <p className="font-bold text-gray-800">Bank Account Details</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Account Holder</p>
                    <p className="font-semibold text-gray-800 text-sm">
                      {withdrawal.withdrawalDetails?.accountHolderName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Bank Name</p>
                    <p className="font-semibold text-gray-800 text-sm">
                      {withdrawal.withdrawalDetails?.bankName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Account Number</p>
                    <p className="font-mono font-bold text-gray-800 text-sm">
                      {withdrawal.withdrawalDetails?.accountNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">IFSC Code</p>
                    <p className="font-mono font-bold text-gray-800 text-sm">
                      {withdrawal.withdrawalDetails?.ifscCode || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                {/* Transaction ID */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center text-gray-500 text-xs mb-1.5">
                    <Hash size={14} className="mr-1" />
                    Transaction ID
                  </div>
                  <p className="font-mono font-bold text-gray-800 text-xs">
                    {withdrawal._id.slice(-12)}
                  </p>
                </div>

                {/* Date */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center text-gray-500 text-xs mb-1.5">
                    <Calendar size={14} className="mr-1" />
                    Request Date
                  </div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {new Date(withdrawal.createdAt).toLocaleDateString('en-IN', {
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
                  <button
                    onClick={() => setApproveModal(withdrawal._id)}
                    disabled={actionLoading === withdrawal._id}
                    className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-medium text-sm"
                  >
                    <Check size={18} />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => setRejectModal(withdrawal._id)}
                    disabled={actionLoading === withdrawal._id}
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

      {/* Approve Modal - Professional Design */}
      {approveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <CheckCircle className="text-white" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white">Approve Withdrawal</h3>
                </div>
                <button
                  onClick={() => {
                    setApproveModal(null);
                    setUtrNumber('');
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
                Enter the UTR/Transaction ID after processing the bank transfer:
              </p>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <CreditCard className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl pl-12 pr-4 py-3.5 mb-6 transition-all outline-none font-mono"
                  placeholder="e.g., 403456789012"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3.5 rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg"
                >
                  Confirm Approval
                </button>
                <button
                  onClick={() => {
                    setApproveModal(null);
                    setUtrNumber('');
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
                  <h3 className="text-xl font-bold text-white">Reject Withdrawal</h3>
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
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-yellow-800 text-xs font-medium">
                  ⚠️ Amount will be refunded to {"users"} wallet upon rejection
                </p>
              </div>
              <p className="text-gray-600 mb-4 text-sm">
                Please provide a detailed reason for rejecting this withdrawal:
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl px-4 py-3 mb-6 transition-all outline-none resize-none"
                rows="5"
                placeholder="e.g., Invalid bank details, Account verification failed, Suspicious activity..."
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

export default PendingWithdrawals;
