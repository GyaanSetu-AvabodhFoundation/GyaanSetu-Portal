document.addEventListener("DOMContentLoaded", () => {
  setupMobileNavigation();
  setupModalHandlers();
  setupSuggestionFormValidation();
  setupCommunityTabs(); // includes comment submission logic
  setupReadMoreToggles();
  setupEmbedAutoResize();
  setupPollFeedback();
  setupRevealOnScroll();
  setupRippleEffect();
  setupTiltCards();
  setupMagneticButtons();
  setupCursorGlow();
  setupLiveImpactStats();
  setupDynamicKnowledgeHub();
  setupPollFeedback();
});

/* =========================
   CONFIG
========================= */
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzkYXVbNrUKgx1Vo4ciGiSBwOQAY9pczteK1zRy8al5FWvLycYfM-CtK4yg1-5zMw3i/exec";

/* =========================
   Navigation
========================= */
function setupMobileNavigation() {
  const menuBtn = document.getElementById("menu-toggle");
  const navList = document.getElementById("primary-nav-list");
  if (!menuBtn || !navList) return;

  menuBtn.addEventListener("click", () => {
    const isOpen = navList.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });
}

/* =========================
   Suggestion Form
========================= */
function setupSuggestionFormValidation() {
  const form = document.getElementById("native-suggestion-form");
  if (!form) return;

  const nameInput = document.getElementById("sugg-name");
  const emailInput = document.getElementById("sugg-email");
  const ideaInput = document.getElementById("sugg-idea");
  const msgBox = document.getElementById("form-message");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = nameInput?.value.trim() || "";
    const email = emailInput?.value.trim() || "";
    const idea = ideaInput?.value.trim() || "";

    const errors = [];
    if (!name) errors.push("Name is required.");
    if (!email) errors.push("Email is required.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Enter a valid email.");
    if (!idea) errors.push("Suggestion cannot be empty.");
    if (idea.length > 1000) errors.push("Suggestion is too long (max 1000 characters).");
    if (containsSpam(idea)) errors.push("Your message seems spam-like. Please revise.");

    if (errors.length) {
      showInlineMessage(msgBox, errors.join(" "), "error");
      return;
    }

    const originalBtnText = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="ri-loader-4-line"></i> Submitting...';
    }

    fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams({
        type: "suggestion",
        name: name,
        email: email,
        suggestion: idea
      })
    })
      .then(() => {
        showInlineMessage(msgBox, "Thanks! Suggestion submitted successfully.", "success");
        showThankYouModal("Thank you! Your suggestion has been saved directly to the GyaanSetu database.");
        form.reset();
      })
      .catch((error) => {
        console.error("Suggestion submit error:", error);
        showInlineMessage(msgBox, "Something went wrong. Please try again.", "error");
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      });
  });
}

/* =========================
   Community Tabs + Comment Submission
========================= */
function setupCommunityTabs() {
  const tabButtons = document.querySelectorAll("[data-tab-target]");
  const panels = document.querySelectorAll(".community-panel");
  if (tabButtons.length && panels.length) {
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-tab-target");
        tabButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        panels.forEach((panel) => {
          panel.hidden = panel.id !== target;
        });
      });
    });
  }

  const commentPanel = document.getElementById("comments-panel");
  if (!commentPanel) return;

  const commentForm = commentPanel.querySelector("#comment-form") || commentPanel.querySelector("form");
  const postBtn = commentPanel.querySelector('button[type="submit"]') || commentPanel.querySelector("button");
  const nameInput = document.getElementById("comment-name");
  const textInput = document.getElementById("comment-text");
  const msgBox = document.getElementById("comment-message");
  const commentList = document.getElementById("comment-list");

  if (!nameInput || !textInput || !postBtn) return;

  const submitComment = (e) => {
    if (e) e.preventDefault();

    const name = nameInput.value.trim();
    const comment = textInput.value.trim();

    if (!name || !comment) {
      if (msgBox) showInlineMessage(msgBox, "Bhai, naam aur comment dono likhna zaroori hai!", "error");
      else alert("Bhai, naam aur comment dono likhna zaroori hai!");
      return;
    }

    const originalText = postBtn.innerHTML;
    postBtn.disabled = true;
    postBtn.innerHTML = '<i class="ri-loader-4-line"></i> Posting...';

    fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams({
        type: "comment",
        name: name,
        comment: comment
      })
    })
      .then(() => {
        if (commentList) {
          const li = document.createElement("li");
          li.className = "card";
          li.innerHTML = `<p><strong>${escapeHTML(name)}</strong></p><p>${escapeHTML(comment)}</p>`;
          commentList.prepend(li);
        }

        if (msgBox) showInlineMessage(msgBox, "Comment posted successfully.", "success");
        showThankYouModal("Thanks! Tera comment GyaanSetu wall pe save ho gaya hai.");
        nameInput.value = "";
        textInput.value = "";
      })
      .catch((error) => {
        console.error("Comment submit error:", error);
        if (msgBox) showInlineMessage(msgBox, "Kuch error aaya, phir se try kar!", "error");
        else alert("Kuch error aaya, phir se try kar!");
      })
      .finally(() => {
        postBtn.disabled = false;
        postBtn.innerHTML = originalText;
      });
  };

  if (commentForm) commentForm.addEventListener("submit", submitComment);
  else postBtn.addEventListener("click", submitComment);
}

/* =========================
   Knowledge Hub Read More
========================= */
function setupReadMoreToggles() {
  const buttons = document.querySelectorAll(".read-more-btn");
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".knowledge-card");
      if (!card) return;
      card.classList.toggle("expanded");
      btn.textContent = card.classList.contains("expanded") ? "Read Less" : "Read More";
    });
  });
}

/* =========================
   Embed Resize
========================= */
function setupEmbedAutoResize() {
  const iframes = document.querySelectorAll(".embed-wrapper iframe");
  if (!iframes.length) return;

  const resize = () => {
    const w = window.innerWidth;
    iframes.forEach((i) => {
      i.style.height = w < 576 ? "520px" : w < 992 ? "620px" : "700px";
    });
  };

  iframes.forEach((i) => i.addEventListener("load", resize));
  window.addEventListener("resize", resize);
  resize();
}


/* =========================
   Reveal on Scroll
========================= */
function setupRevealOnScroll() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("show");
      });
    },
    { threshold: 0.12 }
  );

  els.forEach((el) => io.observe(el));
}

/* =========================
   Ripple Effect
========================= */
function setupRippleEffect() {
  const rippleEls = document.querySelectorAll(".ripple");
  if (!rippleEls.length) return;

  rippleEls.forEach((el) => {
    el.addEventListener("click", function (e) {
      const dot = document.createElement("span");
      dot.classList.add("ripple-dot");
      const rect = this.getBoundingClientRect();
      dot.style.left = `${e.clientX - rect.left}px`;
      dot.style.top = `${e.clientY - rect.top}px`;
      this.appendChild(dot);
      setTimeout(() => dot.remove(), 650);
    });
  });
}

/* =========================
   Tilt Cards
========================= */
function setupTiltCards() {
  const tiltEls = document.querySelectorAll(".tilt");
  if (!tiltEls.length) return;

  tiltEls.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const rx = ((y / r.height) - 0.5) * -8;
      const ry = ((x / r.width) - 0.5) * 8;
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "rotateX(0) rotateY(0)";
    });
  });
}

/* =========================
   Magnetic Buttons
========================= */
function setupMagneticButtons() {
  const magneticEls = document.querySelectorAll(".magnetic");
  if (!magneticEls.length) return;

  magneticEls.forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
    });

    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "translate(0,0)";
    });
  });
}

/* =========================
   Cursor Glow
========================= */
function setupCursorGlow() {
  const glow = document.getElementById("cursorGlow");
  if (!glow) return;

  window.addEventListener("mousemove", (e) => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  });
}

/* =========================
   Modal
========================= */
function setupModalHandlers() {
  const modal = document.getElementById("thankyou-modal");
  const closeBtn = document.getElementById("modal-close");
  if (!modal || !closeBtn) return;

  modal.classList.remove("is-open");
  modal.setAttribute("hidden", "");

  closeBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    hideThankYouModal();
  });

  modal.addEventListener("pointerdown", (e) => {
    if (e.target === modal) hideThankYouModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideThankYouModal();
  });
}

function showThankYouModal(message) {
  const modal = document.getElementById("thankyou-modal");
  const text = document.getElementById("thankyou-text");
  if (!modal || !text) return alert(message);

  text.textContent = message;
  modal.removeAttribute("hidden");
  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function hideThankYouModal() {
  const modal = document.getElementById("thankyou-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("hidden", "");
  document.body.style.overflow = "";
}

/* =========================
   Live Impact Counter
========================= */
function setupLiveImpactStats() {
  const stats = document.querySelectorAll(".stat-grid span");
  if (!stats.length) return;

  stats.forEach((stat) => {
    const original = stat.textContent.trim();
    const hasPlus = original.includes("+");
    const target = parseInt(original.replace(/[+,]/g, ""), 10);
    if (isNaN(target)) return;

    const duration = 1600;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const count = Math.floor(progress * target);
      stat.textContent = count.toLocaleString() + (hasPlus ? "+" : "");
      if (progress < 1) requestAnimationFrame(step);
      else stat.textContent = target.toLocaleString() + (hasPlus ? "+" : "");
    };

    requestAnimationFrame(step);
  });
}
async function setupDynamicKnowledgeHub() {
  const container = document.getElementById("wp-posts-container");
  if (!container) return; // agar container nahi mila to silently skip

  const site = "education35647.wordpress.com";
  const apiURL = `https://public-api.wordpress.com/rest/v1.1/sites/${site}/posts/?number=3`;

  try {
    container.innerHTML = `<p class="meta">Loading latest insights...</p>`;

    const response = await fetch(apiURL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const posts = data?.posts || [];

    if (!posts.length) {
      container.innerHTML = `<p class="meta">No posts found.</p>`;
      return;
    }

    container.innerHTML = posts.map((post) => `
      <article class="card knowledge-card">
        <h3>${escapeHTML(post.title || "Untitled Post")}</h3>
        <p class="meta">Published: ${new Date(post.date).toLocaleDateString()}</p>
        <div class="excerpt">${post.excerpt || ""}</div>
        <a href="${post.URL}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">Read More</a>
      </article>
    `).join("");
  } catch (err) {
    console.error("Knowledge Hub load error:", err);
    container.innerHTML = `<p class="meta">Failed to load insights. Please try again.</p>`;
  }
}
/* =========================
   Poll Feedback
========================= */

function setupPollFeedback() {
  const pollForm = document.getElementById("poll-form");
  if (!pollForm) return;

  pollForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // IMPORTANT: current HTML uses name="priority_poll"
    const selectedOption = pollForm.querySelector('input[name="priority_poll"]:checked')?.value;
    if (!selectedOption) {
      alert("Bhai, pehle ek option select kar!");
      return;
    }

    const submitBtn = pollForm.querySelector('button[type="submit"]') || pollForm.querySelector("button");
    const originalText = submitBtn ? submitBtn.innerHTML : "";

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="ri-loader-4-line"></i> Voting...';
    }

    fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams({
        type: "poll",
        option: selectedOption
      })
    })
      .then(() => {
        showThankYouModal("Thanks for voting! Your response is saved in our database.");
        pollForm.reset();
      })
      .catch((error) => {
        console.error("Poll submit error:", error);
        alert("Vote submit nahi hua. Dobara try kar.");
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
  });
}

/* =========================
   Utility
========================= */
function containsSpam(text) {
  const t = (text || "").toLowerCase();
  const spamWords = ["buy now", "free money", "click here", "http://", "https://"];
  return spamWords.some((w) => t.includes(w)) || /(.)\1{7,}/.test(text || "");
}

function showInlineMessage(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className = "form-message";
  el.classList.add(type === "error" ? "msg-error" : "msg-success");
}

function escapeHTML(str = "") {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}