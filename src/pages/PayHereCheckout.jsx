import React, {  useEffect } from 'react';
import md5 from 'crypto-js/md5';

const PayHereCheckout = ({ invoiceData, studentData, selectedClass, onComplete, onCancel }) => {
    const merchantId = '1230593';
    const merchantSecret = 'MTM1NzI1MTMyNzMzMDg5ODA4MjM2MjYzOTE5MTgzMDM5NjQ0MzY5';
    const orderId = invoiceData.invoice_id;
    const amount = invoiceData.amount;
    const currency = 'LKR';
    // const [showEmailForm, setShowEmailForm] = useState(false);
    // const [emailSubject, setEmailSubject] = useState('Payment Invoice');
    // const [emailBody, setEmailBody] = useState('Please find attached your payment invoice.');

    const amountFormatted = parseFloat(amount)
        .toLocaleString('en-US', { minimumFractionDigits: 2 })
        .replaceAll(',', '');

    const hashedSecret = md5(merchantSecret).toString().toUpperCase();
    const hash = md5(merchantId + orderId + amountFormatted + currency + hashedSecret)
        .toString()
        .toUpperCase();

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://www.payhere.lk/lib/payhere.js';
        script.async = true;
        script.onload = () => {
            console.log('PayHere SDK loaded');
        };
        document.body.appendChild(script);
        
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handlePayNow = () => {
        window.payhere.onCompleted = function () {
            onComplete(true);
        };

        window.payhere.onDismissed = function () {
            onComplete(false);
        };

        window.payhere.onError = function (error) {
            console.error("Payment error:", error);
            onComplete(false);
        };

        const payment = {
            sandbox: true,
            merchant_id: merchantId,
            return_url: undefined,
            cancel_url: undefined,
            notify_url: 'https://23d1-212-104-231-128.ngrok-free.app',
            order_id: orderId,
            items: `${selectedClass.name} (${selectedClass.type})`,
            amount: amountFormatted,
            currency: currency,
            hash: hash,
            first_name: studentData.firstName,
            last_name: studentData.lastName,
            email: studentData.email || 'student@example.com',
            phone: studentData.mobile || '0770000000',
            address: 'School Fee Payment',
            city: 'Colombo',
            country: 'Sri Lanka',
        };

        window.payhere.startPayment(payment);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto mt-10">
            <h2 className="text-2xl font-bold mb-4 text-center">Payment Checkout</h2>
            
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Invoice Details</h3>
                <div className="bg-gray-50 p-4 rounded">
                    <p><span className="font-medium">Date:</span>  {invoiceData.date}</p>
                    <p><span className="font-medium">Invoice ID:</span> {invoiceData.invoice_id}</p>
                    <p><span className="font-medium">Student ID:</span> {invoiceData.student_id}</p>
                    <p><span className="font-medium">Student:</span> {studentData.firstName} {studentData.lastName}</p>
                    <p><span className="font-medium">Class:</span> {selectedClass.name} ({selectedClass.type})</p>
                    <p><span className="font-medium">Amount:</span> LKR {amountFormatted}</p>
                </div>
            </div>
            
            <div className="flex flex-col space-y-3">
                <div className="flex justify-between">
                    <button 
                        onClick={handlePayNow}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded flex-1"
                    >
                        Proceed to Payment
                    </button>
                </div>
                <div className="flex justify-between">
                    <button 
                        onClick={onCancel}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded flex-1"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PayHereCheckout;