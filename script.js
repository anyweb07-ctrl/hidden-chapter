
/* THE HIDDEN CHAPTER - APP LOGIC */

// STEP 1: ADD YOUR SUPABASE PROJECT DETAILS
const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

// Do not put your service role key or ADMIN_SECRET here.

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/private-letters`;

const loginScreen = document.getElementById("loginScreen");
const letterScreen = document.getElementById("letterScreen");
const adminScreen = document.getElementById("adminScreen");
const createScreen = document.getElementById("createScreen");

const loginForm = document.getElementById("loginForm");
const adminForm = document.getElementById("adminForm");
const createForm = document.getElementById("createForm");

let adminSecret = "";

// CALL SECURE SUPABASE EDGE FUNCTION
async function callFunction(payload) {
  if (
    SUPABASE_URL.includes("YOUR_SUPABASE") ||
    SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")
  ) {
    throw new Error("Supabase details have not been configured yet.");
  }

  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "Something went wrong.");
  }

  return result;
}

// SHOW ONE SCREEN AT A TIME
function showScreen(screen) {
  [loginScreen, letterScreen, adminScreen, createScreen]
    .forEach(item => item.classList.add("hidden"));

  screen.classList.remove("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// VISITOR LOGIN
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const password = document.getElementById("visitorPassword").value;
  const errorBox = document.getElementById("loginError");
  const button = document.getElementById("unlockButton");

  errorBox.textContent = "";
  button.disabled = true;
  button.textContent = "Checking...";

  try {
    const result = await callFunction({
      action: "unlock",
      password
    });

    if (!result.success || !result.letter) {
      throw new Error("Unable to unlock this letter.");
    }

    document.getElementById("letterName").textContent =
      result.letter.name;

    document.getElementById("letterTitle").textContent =
      result.letter.title;

    // Preserve all original line breaks and display text safely.
    document.getElementById("letterMessage").textContent =
      result.letter.message;

    document.getElementById("visitorPassword").value = "";

    showScreen(letterScreen);

  } catch (error) {
    errorBox.textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = 'Unlock My Letter <span>→</span>';
  }
});

// SHOW / HIDE VISITOR PASSWORD
document.getElementById("togglePassword")
  .addEventListener("click", () => {
    const input = document.getElementById("visitorPassword");

    input.type = input.type === "password" ? "text" : "password";
  });

// CLOSE LETTER
document.getElementById("closeLetter")
  .addEventListener("click", () => {
    document.getElementById("letterMessage").textContent = "";
    showScreen(loginScreen);
  });

// ADMIN LOGIN
adminForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const errorBox = document.getElementById("adminError");
  const input = document.getElementById("adminPassword");

  errorBox.textContent = "";

  // The secret is checked by the Edge Function when creating a letter.
  // This screen only holds it temporarily in memory.
  if (!input.value) {
    errorBox.textContent = "Enter your admin secret.";
    return;
  }

  adminSecret = input.value;
  input.value = "";

  showScreen(createScreen);
});

// CREATE PRIVATE LETTER
createForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const button = document.getElementById("createButton");
  const errorBox = document.getElementById("createError");
  const successBox = document.getElementById("createSuccess");

  errorBox.textContent = "";
  successBox.textContent = "";

  button.disabled = true;
  button.textContent = "Saving...";

  const name = document.getElementById("letterRecipient").value;
  const title = document.getElementById("newLetterTitle").value;
  const password = document.getElementById("newLetterPassword").value;
  const message = document.getElementById("newLetterMessage").value;

  try {
    const result = await callFunction({
      action: "create",
      adminKey: adminSecret,
      name,
      title,
      password,
      message
    });

    if (!result.success) {
      throw new Error("Letter could not be saved.");
    }

    successBox.textContent = "Your private letter was created successfully.";

    createForm.reset();

  } catch (error) {
    errorBox.textContent = error.message;

    if (error.message === "Invalid admin key") {
      adminSecret = "";
      showScreen(adminScreen);
      document.getElementById("adminError").textContent =
        "Invalid admin secret. Please try again.";
    }

  } finally {
    button.disabled = false;
    button.textContent = "Save Private Letter →";
  }
});

// OPEN ADMIN PANEL ONLY WITH #admin URL
if (window.location.hash === "#admin") {
  showScreen(adminScreen);
} else {
  showScreen(loginScreen);
}
