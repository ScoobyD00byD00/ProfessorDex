// src/services/tcgApiService.js
export async function searchCards(query, field = "name") {
    const q = `${field}:"${query}"`; // e.g., artist:"Yuka Morii"
    const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q)}`, {
      headers: {
        'X-Api-Key': 'YOUR_API_KEY' // remove if not required
      }
    });
  
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
  
    const data = await response.json();
    return data.data;
  }
  