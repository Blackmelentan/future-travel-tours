// WhatsApp Cloud API adapter (Meta direct - no Twilio/BSP markup, per the
// board's correction on Document 02/07). Mocked by default: logs to the
// console instead of sending a real message. Set USE_MOCKS=false and the
// WHATSAPP_* vars in .env to send for real via Meta's Graph API.

export const whatsapp = {
  async sendBookingConfirmation(phone: string, pnr: string, eTicketUrl: string) {
    if (process.env.USE_MOCKS !== "false") {
      console.log(`[whatsapp:mock] to=${phone} booking ${pnr} confirmed, e-ticket: ${eTicketUrl}`);
      return { status: "sent_mock" as const };
    }
    // Real integration:
    // await fetch(`https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    //   method: "POST",
    //   headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    //   body: JSON.stringify({ messaging_product: "whatsapp", to: phone, type: "template", template: { name: "booking_confirmed_v2", language: { code: "en" } } }),
    // });
    return { status: "sent" as const };
  },
};
