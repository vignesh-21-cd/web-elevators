import { useState, useRef } from "react";
import "./App.css";

/* ---------------- SECURITY HELPERS ---------------- */

const sanitizeInput = (input, { trim = true } = {}) => {
  if (typeof input !== "string") return "";
  const cleaned = input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>\"']/g, "");
  return trim ? cleaned.trim() : cleaned;
};

const validateInput = (name, email, message) => {
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push("Name is required");
  }

  if (!email || email.trim().length === 0) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push("Invalid email format");
  }

  if (!message || message.trim().length === 0) {
    errors.push("Project description is required");
  } else if (message.length < 10) {
    errors.push("Project description must be at least 10 characters");
  }

  return errors;
};

/* ---------------- RATE LIMIT ---------------- */

const RATE_LIMIT_WINDOW = 60000;
const MAX_SUBMISSIONS = 3;
const submissionTimes = [];

const checkRateLimit = () => {
  const now = Date.now();
  while (
    submissionTimes.length > 0 &&
    submissionTimes[0] < now - RATE_LIMIT_WINDOW
  ) {
    submissionTimes.shift();
  }
  if (submissionTimes.length >= MAX_SUBMISSIONS) return false;
  submissionTimes.push(now);
  return true;
};

/* ---------------- MAIN COMPONENT ---------------- */

function App() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [validationErrors, setValidationErrors] = useState([]);
  const formRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!checkRateLimit()) {
      setSubmitStatus("error");
      setValidationErrors([
        "Too many submissions. Please wait a minute before trying again.",
      ]);
      return;
    }

    const sanitizedName = sanitizeInput(formData.name);
    const sanitizedEmail = sanitizeInput(formData.email);
    const sanitizedPhone = sanitizeInput(formData.phone);
    const sanitizedMessage = sanitizeInput(formData.message);

    const errors = validateInput(
      sanitizedName,
      sanitizedEmail,
      sanitizedMessage
    );

    if (errors.length > 0) {
      setValidationErrors(errors);
      setSubmitStatus("error");
      return;
    }

    setValidationErrors([]);
    setSubmitStatus("sending");

    try {
      const emailData = {
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        message: sanitizedMessage,
        _subject: `New Lead from Web Elevators - ${sanitizedName}`,
        _captcha: false,
      };

      const emails = [
        "vigneshgowdakumar@gmail.com",
        "hitheshap@gmail.com",
      ];

      const promises = emails.map((email) =>
        fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(emailData),
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(responses.map((r) => r.json()));

      const success = results.some((r) => r.success);

      if (success) {
        setFormData({ name: "", email: "", phone: "", message: "" });
        setSubmitStatus("success");
        if (formRef.current) formRef.current.reset();
      } else {
        setSubmitStatus("error");
        setValidationErrors([
          "Failed to send message. Please try again.",
        ]);
      }
    } catch (error) {
      setSubmitStatus("error");
      setValidationErrors([
        "Something went wrong. Please try again.",
      ]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value, { trim: false });
    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    if (submitStatus !== "idle") setSubmitStatus("idle");
    if (validationErrors.length > 0) setValidationErrors([]);
  };

  return (
    <>
      <header className="header">
        <a href="#" className="logo">Web Elevators</a>
        <nav className={`nav ${menuOpen ? "open" : ""}`}>
          <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>
        <button
          className={`nav-toggle ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      <main>
        <section className="hero">
          <p className="hero-eyebrow">Elevating Local Businesses Online</p>
          <h1 className="hero-headline">
            Professional Websites That <em>Grow Your Business</em>.
          </h1>
          <p className="hero-sub">
            We design modern, high-converting websites for local shops,
            startups, and service businesses that want to stand out and
            attract more customers.
          </p>
          <div className="hero-cta">
            <a href="#contact" className="btn btn-primary">
              Get Your Free Quote
            </a>
          </div>
        </section>

        <section id="contact" className="section contact">
          <div className="container contact-wrap">
            <div className="contact-intro">
              <span className="section-label">Contact</span>
              <h2 className="section-title">
                Let’s Build Your Website.
              </h2>
              <p className="contact-text">
                Tell us about your business and we’ll respond within 24 hours.
              </p>
            </div>

            <form
              ref={formRef}
              className="contact-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <label className="form-label">Name</label>
              <input
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Your name"
              />

              <label className="form-label">Email</label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="Your email"
              />

              <label className="form-label">Phone (Optional)</label>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="Your phone number"
              />

              <label className="form-label">Project Description</label>
              <textarea
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                className="form-input form-textarea"
                placeholder="Tell us about your business and what you need..."
              />

              {validationErrors.length > 0 && (
                <div className="form-errors">
                  {validationErrors.map((error, index) => (
                    <p key={index} className="form-message form-message--error">
                      {error}
                    </p>
                  ))}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitStatus === "sending"}
              >
                {submitStatus === "sending"
                  ? "Sending…"
                  : "Get Free Quote"}
              </button>

              {submitStatus === "success" && (
                <p className="form-message form-message--success">
                  Thanks! We’ll contact you soon.
                </p>
              )}
            </form>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <p className="footer-brand">Web Elevators</p>
          <div className="footer-right">
            <a href="mailto:vigneshgowdakumar@gmail.com" className="footer-email">
              vigneshgowdakumar@gmail.com
            </a>
            <a href="mailto:hitheshap@gmail.com" className="footer-email">
              hitheshap@gmail.com
            </a>
            <p className="footer-copy">
              © {new Date().getFullYear()} Web Elevators. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
