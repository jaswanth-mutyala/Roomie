export type UpiConfig = {
  upiId: string;
  name: string;
  amount: number;
  note?: string;
};

/**
 * Generates a valid UPI deep link string.
 */
export function generateUpiLink({ upiId, name, amount, note = "Roomie settlement" }: UpiConfig): string {
  if (!upiId || !upiId.includes("@")) {
    throw new Error("Invalid UPI ID");
  }
  if (!amount || amount <= 0) {
    throw new Error("Invalid amount");
  }

  const encodedId = encodeURIComponent(upiId);
  const encodedName = encodeURIComponent(name);
  const encodedNote = encodeURIComponent(note);
  const formattedAmount = amount.toFixed(2);

  return `upi://pay?pa=${encodedId}&pn=${encodedName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}`;
}

/**
 * Attempts to open the UPI app installed on the device via the generated deep link.
 * Note: On the web, we use an anchor tag to trigger the OS-level URL handler.
 */
export function openUpiLink(url: string): boolean {
  try {
    const link = document.createElement("a");
    link.href = url;
    // On mobile devices, this should trigger the app chooser or the default UPI app.
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error("Failed to open UPI link:", error);
    return false;
  }
}

/**
 * Attempts to share the UPI deep link using the Web Share API (so the user can send it via WhatsApp, etc.).
 * Useful for "requesting" money, where you generate a link for your own UPI ID and send it to a friend.
 */
export async function shareUpiRequest(config: UpiConfig): Promise<boolean> {
  const link = generateUpiLink(config);
  const text = `Hey! Can you settle up ₹${config.amount} for ${config.note}? Tap this link to pay via UPI:`;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: "Settle up on Roomie",
        text: text,
        url: link,
      });
      return true;
    } catch (error) {
      console.error("Error sharing UPI link:", error);
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${text} ${link}`);
      return false;
    }
  } else {
    // Fallback: copy to clipboard if Web Share API is not supported
    try {
      await navigator.clipboard.writeText(`${text} ${link}`);
      return false; // indicating it was copied, not shared natively
    } catch (e) {
      console.error("Clipboard copy failed", e);
      return false;
    }
  }
}
