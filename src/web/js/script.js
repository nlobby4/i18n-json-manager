import { loadJson } from "./utils/u-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const template = await loadJson("./assets/json/template.json");
    const fileList = await loadJson("./assets/json/file-list.json");

    createFileList(fileList, template);
    loadSchema(template);
  } catch (error) {
    console.error(error.message);
    alert("An error occurred while loading the necessary files.");
  }
});

/**
 * Create a list of files in the file table
 *
 * @param {Array<string>} fileList The list of file names to display
 * @param {Object} template The template JSON
 */
async function createFileList(fileList, template) {
  const fileListElement = document.querySelector("#fileList tbody");

  for (const fileName of fileList) {
    const row = document.createElement("tr");

    // Create clickable file name
    const fileCell = document.createElement("td");
    const fileLink = document.createElement("a");
    fileLink.href = "#";
    fileLink.textContent = fileName;
    fileLink.addEventListener("click", () => parseFile(fileName, row));
    fileCell.appendChild(fileLink);

    const jsonContent = await loadJson(`./assets/locale/${fileName}`);
    const authorsCell = document.createElement("td");
    const coverageCell = document.createElement("td");
    updateAuthors(authorsCell, jsonContent);
    updateCoverage(coverageCell, jsonContent, template);

    row.appendChild(fileCell);
    row.appendChild(authorsCell);
    row.appendChild(coverageCell);
    fileListElement.appendChild(row);
  }
}

/**
 * Updates the authors field in the file list table.
 *
 * @param {HTMLElement} authorsCell The table cell to update
 * @param {Object} jsonContent The JSON content of the file
 */
function updateAuthors(authorsCell, jsonContent) {
  const authors = jsonContent["@metadata"]?.authors || [];
  authorsCell.textContent = authors.length > 0 ? authors.join(", ") : "No authors";
}

/**
 * Updates the coverage field in the file list table.
 *
 * @param {HTMLElement} coverageCell The table cell to update
 * @param {Object} jsonContent The JSON content of the file
 * @param {Object} template The template JSON
 */
function updateCoverage(coverageCell, jsonContent, template) {
  let totalKeys = 0;
  let filledKeys = 0;

  function traverse(json, tmpl) {
    for (const key in tmpl) {
      if (!Object.prototype.hasOwnProperty.call(tmpl, key)) continue;
      if (key === "global.EOF") continue;

      if (typeof tmpl[key] === "object" && tmpl[key] !== null) {
        traverse(json?.[key] || {}, tmpl[key]);
      } else {
        totalKeys++;
        if (json?.[key] && json[key] !== "") filledKeys++;
      }
    }
  }

  traverse(jsonContent, template);
  coverageCell.textContent = totalKeys > 0
    ? `${((filledKeys / totalKeys) * 100).toFixed(1)}%`
    : "100.0%";
}



/**
 * Loads the template schema (keys & descriptions) but leaves values empty.
 *
 * @param {Object} templateJson The template JSON containing translations
 * @param {string} parentKey (optional) Used for nested keys
 */
function loadSchema(templateJson, parentKey = "") {
  const translationsTableBody = document.querySelector("#translations tbody");
  translationsTableBody.innerHTML = ""; // Clear existing entries

  Object.keys(templateJson).forEach(key => {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    const value = templateJson[key];

    if (typeof value === "object" && value !== null) {
      // If the value is an object, recurse to get its keys
      loadSchema(value, fullKey);
    } else {
      // Otherwise, display the key and description, leave value empty
      const row = document.createElement("tr");
      row.dataset.key = fullKey; // Store key for reference

      row.innerHTML = `
        <td>${fullKey}</td>
        <td><input type="text" class="value-field"></td>
        <td>${value || ""}</td>
      `;

      translationsTableBody.appendChild(row);
    }
  });
}

/**
 * Loads the selected file's translations and fills in the appropriate fields.
 * Also updates the authors column.
 *
 * @param {string} fileName The file to load translations from
 * @param {HTMLElement} fileRow The row corresponding to the selected file
 */
async function parseFile(fileName, fileRow) {
  try {
    const jsonContent = await loadJson(`./assets/locale/${fileName}`);

    // Update authors cell in file table
    const authorsCell = fileRow.children[1]; // The second column is "authors"
    updateAuthors(authorsCell, jsonContent);

    // Fill in translation values in the table
    updateTableWithTranslations(jsonContent);
  } catch (error) {
    console.error("Error loading JSON file:", error);
  }
}

/**
 * Fills in the values in the translations table based on the selected file.
 * If a key exists, it updates the value; if not, it marks the field red.
 *
 * @param {Object} jsonContent The translation file content
 */
function updateTableWithTranslations(jsonContent) {
  const rows = document.querySelectorAll("#translations tbody tr");

  rows.forEach(row => {
    const key = row.dataset.key;
    const valueInput = row.querySelector(".value-field");

    if (jsonContent.hasOwnProperty(key)) {
      valueInput.value = jsonContent[key];
      row.style.backgroundColor = ""; // Reset background
    } else {
      valueInput.value = ""; // Keep it empty
      row.style.backgroundColor = "red"; // Highlight missing keys
    }
  });
}
