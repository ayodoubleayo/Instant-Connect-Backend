export const validatePayment = (amount: number) => {
  if (amount <= 0) throw new Error("Invalid amount");
};
