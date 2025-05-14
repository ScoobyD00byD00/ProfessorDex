const API_KEY = import.meta.env.VITE_TCG_API_KEY;

export async function searchCards(query, field = "name") {
  const q = `${field}:"${query}"`;

  const response = await fetch(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q)}&pageSize=250`, {
    headers: {
      'X-Api-Key': API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}
