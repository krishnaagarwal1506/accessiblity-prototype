// Use a debounce to prevent excessive checks
let checkTimeout = null;
let isChecking = false;

function scheduleAccessibilityCheck() {
  if (checkTimeout) {
    clearTimeout(checkTimeout);
  }

  checkTimeout = setTimeout(() => {
    if (!isChecking) {
      runAccessibilityCheck();
    }
  }, 300); // Debounce by 300ms
}

function runAccessibilityCheck() {
  isChecking = true;

  // Use requestIdleCallback to run during idle time
  if ("requestIdleCallback" in window) {
    requestIdleCallback(
      (deadline) => {
        findInaccessibleElements(deadline);
        isChecking = false;
      },
      { timeout: 2000 }
    );
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      findInaccessibleElements();
      isChecking = false;
    }, 0);
  }
}

// Helper function to check if element or any parent is accessible
function hasAccessibleParent(element) {
  const nativeInteractiveTags = ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"];
  const interactiveRoles = [
    "button",
    "link",
    "checkbox",
    "menuitem",
    "tab",
    "radio",
  ];

  let current = element.parentElement;
  while (current && current !== document.body) {
    const tagName = current.tagName.toUpperCase();

    // Check if parent is a native interactive element
    if (nativeInteractiveTags.includes(tagName)) {
      return true;
    }

    // Check if parent has accessible role or tabindex
    const role = current.getAttribute("role");
    const tabIndex = current.getAttribute("tabindex");

    if (
      interactiveRoles.includes(role) ||
      (tabIndex && parseInt(tabIndex, 10) >= 0)
    ) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

function findInaccessibleElements(deadline) {
  console.log("Running accessibility checks...");
  const allElements = document.querySelectorAll("*");
  console.log(`Total elements found: ${allElements.length}`);

  const inaccessibleElements = [];
  const nativeInteractiveTags = ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"];
  const interactiveRoles = [
    "button",
    "link",
    "checkbox",
    "menuitem",
    "tab",
    "radio",
  ];

  // First, remove all existing highlights (disconnect observer temporarily)
  const elementsToHighlight = new Set();

  // Process elements in chunks to avoid blocking
  const BATCH_SIZE = 100;
  let currentIndex = 0;

  function processBatch() {
    const startTime = performance.now();
    const endIndex = Math.min(currentIndex + BATCH_SIZE, allElements.length);

    for (let i = currentIndex; i < endIndex; i++) {
      const el = allElements[i];
      const tagName = el.tagName.toUpperCase();

      // Skip native interactive elements early
      if (nativeInteractiveTags.includes(tagName)) {
        continue;
      }

      // Skip if element is a child of an accessible parent
      if (hasAccessibleParent(el)) {
        continue;
      }

      const role = el.getAttribute("role");
      const tabIndex = el.getAttribute("tabindex");

      // Enhanced clickable detection
      const isClickable =
        el.hasAttribute("onclick") ||
        typeof el.onclick === "function" ||
        el.style.cursor === "pointer" ||
        window.getComputedStyle(el).cursor === "pointer" ||
        hasClickListener(el);

      // Check if the element is accessible by keyboard
      const isKeyboardAccessible =
        (tabIndex && parseInt(tabIndex, 10) >= 0) ||
        interactiveRoles.includes(role);

      if (isClickable && !isKeyboardAccessible) {
        elementsToHighlight.add(el);

        inaccessibleElements.push({
          tagName: el.tagName.toLowerCase(),
          outerHTML:
            el.outerHTML.length > 100
              ? el.outerHTML.substring(0, 100) + "..."
              : el.outerHTML,
          reason:
            "Clickable but lacks an interactive role and a tabindex of 0 or greater.",
        });
      }

      // Check if we should yield to the main thread
      if (deadline && deadline.timeRemaining() < 1 && i < endIndex - 1) {
        currentIndex = i + 1;
        requestIdleCallback(processBatch, { timeout: 2000 });
        return;
      }
    }

    currentIndex = endIndex;

    // If we've processed all elements, apply highlights and send results
    if (currentIndex >= allElements.length) {
      console.log(`Found ${inaccessibleElements.length} inaccessible elements`);

      // Temporarily disconnect observer to prevent infinite loop
      if (observer) {
        observer.disconnect();
      }

      // Remove all existing highlights
      document.querySelectorAll(".inaccessible-highlight").forEach((el) => {
        el.classList.remove("inaccessible-highlight");
      });

      // Add new highlights
      elementsToHighlight.forEach((el) => {
        el.classList.add("inaccessible-highlight");
      });

      // Reconnect observer after a short delay
      setTimeout(() => {
        startObserver();
      }, 100);

      // Send results
      chrome.runtime.sendMessage({
        type: "ACCESSIBILITY_ISSUES",
        payload: inaccessibleElements,
      });
    } else {
      // More elements to process
      if ("requestIdleCallback" in window) {
        requestIdleCallback(processBatch, { timeout: 2000 });
      } else {
        setTimeout(processBatch, 0);
      }
    }
  }

  // Start processing
  processBatch();
}

// Helper function to detect if element has click event listener
function hasClickListener(element) {
  // Check for event listeners through getEventListeners (works in DevTools context)
  if (typeof getEventListeners === "function") {
    try {
      const listeners = getEventListeners(element);
      return listeners.click && listeners.click.length > 0;
    } catch (e) {
      return false;
    }
  }

  // Fallback: check for common clickable patterns
  return false;
}

let observer = null;

function startObserver() {
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    // Filter out mutations caused by our own highlight class changes
    const relevantMutation = mutations.some((mutation) => {
      // Ignore class changes to inaccessible-highlight
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const target = mutation.target;
        if (
          target.classList &&
          target.classList.contains("inaccessible-highlight")
        ) {
          return false;
        }
      }
      return true;
    });

    if (relevantMutation) {
      console.log("DOM mutation detected. Scheduling accessibility check...");
      scheduleAccessibilityCheck();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["onclick", "role", "tabindex", "style", "cursor"],
  });
}

// Listen for messages from devtools/background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "RUN_ACCESSIBILITY_CHECK") {
    runAccessibilityCheck();
    sendResponse({ status: "started" });
  }
  return true;
});

// Wait for DOM to be ready before starting
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    runAccessibilityCheck();
    startObserver();
  });
} else {
  // DOM is already ready
  runAccessibilityCheck();
  startObserver();
}
