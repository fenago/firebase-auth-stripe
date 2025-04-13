import { loadStripe } from '@stripe/stripe-js';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

let stripePromise;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

// Record a payment in Firestore
export const recordPayment = async (userId, paymentData) => {
  try {
    // Reference to the user document
    const userRef = doc(db, 'users', userId);
    
    // Get the user document
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Create a new payment record
      const paymentRef = doc(db, 'payments', paymentData.id);
      await setDoc(paymentRef, {
        userId,
        amount: paymentData.amount,
        status: paymentData.status,
        created: new Date().toISOString(),
        ...paymentData
      });
      
      // Update the user's subscription status if needed
      if (paymentData.subscription) {
        await updateDoc(userRef, {
          subscriptionStatus: 'active',
          subscriptionId: paymentData.subscription,
          subscriptionEndDate: paymentData.subscriptionEndDate
        });
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error recording payment:', error);
    throw error;
  }
};

// Check subscription status
export const checkSubscription = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        status: userData.subscriptionStatus || 'inactive',
        subscriptionId: userData.subscriptionId || null,
        subscriptionEndDate: userData.subscriptionEndDate || null
      };
    }
    return { status: 'inactive', subscriptionId: null, subscriptionEndDate: null };
  } catch (error) {
    console.error('Error checking subscription:', error);
    throw error;
  }
};
