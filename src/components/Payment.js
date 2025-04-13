import React, { useState } from 'react';
import { Card, Button, Alert, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getStripe, recordPayment } from '../services/StripeService';
import { CardElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';

function CheckoutForm() {
  const { currentUser } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [amount, setAmount] = useState(2000); // $20.00
  const navigate = useNavigate();

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    // Get a reference to a mounted CardElement
    const cardElement = elements.getElement(CardElement);

    // Use your card Element with other Stripe.js APIs
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      setError(`Payment failed: ${error.message}`);
      setProcessing(false);
      return;
    }

    // Here in a real implementation, you would send the payment method ID to your server
    // and complete the payment there. For this demo, we'll simulate a successful payment.
    
    // Mock successful payment data
    const paymentData = {
      id: paymentMethod.id,
      amount: amount,
      status: 'succeeded',
      type: 'one-time',
      paymentMethod: paymentMethod.type,
      created: new Date().toISOString()
    };

    try {
      // Record the payment in Firestore
      await recordPayment(currentUser.uid, paymentData);
      
      setSucceeded(true);
      setError(null);
      
      // Navigate back to the dashboard after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (err) {
      setError(`Failed to process payment: ${err.message}`);
    }
    
    setProcessing(false);
  };

  const handleAmountChange = (e) => {
    // Convert dollars to cents
    setAmount(parseInt(e.target.value * 100));
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      {succeeded && <Alert variant="success">Payment successful!</Alert>}
      
      <Form.Group className="mb-3">
        <Form.Label>Payment Amount ($)</Form.Label>
        <Form.Control 
          type="number" 
          min="1" 
          step="0.01" 
          defaultValue="20.00" 
          onChange={handleAmountChange}
          disabled={processing || succeeded}
        />
      </Form.Group>
      
      <Form.Group className="mb-3">
        <Form.Label>Card Details</Form.Label>
        <div className="p-3 border rounded">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </Form.Group>
      
      <Button 
        className="w-100" 
        type="submit" 
        disabled={processing || !stripe || succeeded}
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </Button>
    </Form>
  );
}

export default function Payment() {
  const stripePromise = getStripe();

  return (
    <Card>
      <Card.Body>
        <h2 className="text-center mb-4">Make a Payment</h2>
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      </Card.Body>
    </Card>
  );
}
