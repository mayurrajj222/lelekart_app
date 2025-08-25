// Wallet handlers for coin redemption
const redeemCoinsFromWallet = async (storage, userId, coinsToRedeem, transactionType, referenceId, description) => {
  try {
    // Get user's wallet
    const wallet = await storage.getWalletByUserId(userId);
    
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.balance < coinsToRedeem) {
      throw new Error('Insufficient wallet balance');
    }

    // Update wallet balance
    const newBalance = wallet.balance - coinsToRedeem;
    await storage.updateWalletBalance(wallet.id, newBalance);

    // Create wallet transaction record
    const transactionData = {
      walletId: wallet.id,
      userId: userId,
      type: 'DEBIT',
      amount: coinsToRedeem,
      transactionType: transactionType,
      referenceId: referenceId,
      description: description,
      date: new Date()
    };

    await storage.createWalletTransaction(transactionData);

    console.log(`Successfully redeemed ${coinsToRedeem} coins from wallet ${wallet.id}`);
    return { success: true, newBalance };
  } catch (error) {
    console.error('Error redeeming coins from wallet:', error);
    throw error;
  }
};

module.exports = {
  redeemCoinsFromWallet
}; 