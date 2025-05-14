import React from "react";
import NavBar from "../components/NavBar";

const ContactPage = () => {
  return (
    <>
      <NavBar />
      <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "1rem" }}>
        <h2>Contact Us</h2>
        <p>If you have questions, feedback, or spot any bugs, drop us a message below!</p>
        <form
          action="https://formsubmit.co/professordex25@gmail.com"
          method="POST"
        >
          <div style={{ marginBottom: "1rem" }}>
            <label>Name:</label>
            <input type="text" name="name" required style={{ width: "100%", padding: "0.5rem" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label>Email:</label>
            <input type="email" name="email" required style={{ width: "100%", padding: "0.5rem" }} />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label>Message:</label>
            <textarea name="message" required rows="5" style={{ width: "100%", padding: "0.5rem" }}></textarea>
          </div>
          {/* Optional - to prevent spam */}
          <input type="hidden" name="_captcha" value="false" />
          <input type="hidden" name="_next" value="https://www.professordex.com/thanks" />
          <button type="submit" style={{ padding: "0.75rem 1.5rem", background: "#1c1c2b", color: "#fff", border: "none", borderRadius: "8px" }}>
            Send Message
          </button>
        </form>
      </div>
    </>
  );
};

export default ContactPage;
