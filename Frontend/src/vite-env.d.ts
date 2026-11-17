/// <reference types="vite/client" />

declare global {
  interface Window {
    Razorpay: any;
    Pose: any;
    Camera: any;
    speechSynthesis: SpeechSynthesis;
  }
}

export {};
