gSf56$#@tghFghv

/**
 * Returns a date string in format YYYY-MM-DD.
 * @param {number} [offsetDays=0] - Number of days to add (positive) or subtract (negative) from today.
 * @returns {string} Date string in YYYY-MM-DD format.
 */
function getDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // months are zero-based
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Examples:
console.log(getDate());    // today's date
console.log(getDate(1));   // tomorrow's date
console.log(getDate(-1));  // yesterday's date
console.log(getDate(30));  // 30 days in the future
console.log(getDate(-100)); // 100 days in the past


code ~/.gitconfig


Sehr geehrte Damen und Herren,

mein Name ist Petro Maliuha, geboren am 04.03.1948. Ich war Patient in Ihrer augenärztlichen Praxis.

Da es für mich aus gesundheitlichen Gründen schwierig ist, weiterhin zu Ihnen zu kommen, möchte ich mich in eine wohnortnahe Praxis überweisen lassen.
Ich bitte Sie daher höflich, alle bisherigen Befunde und Untersuchungsergebnisse zur Verfügung zu stellen.

Bitte senden Sie mir die Unterlagen per E-Mail oder Post.
Bei Rückfragen erreichen Sie mich bzw. meinen Sohn unter folg55ender Telefonnummer: [Ihre Telefonnummer].

Vielen Dank für Ihre Unterstützung.

Mit freundlichen Grüßen
Petro Maliuha