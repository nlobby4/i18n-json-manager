/**
 * Load a JSON file from the given path and return the parsed JSON object.
 *
 * @param {string} filePath The path to the JSON file
 * @return {Promise<Object>} The parsed JSON object
 */
export async function loadJson(filePath) {
  const response = await fetch(filePath);
  if (!response.ok) throw new Error(`Failed to load ${filePath}`);
  return await response.json();
}
