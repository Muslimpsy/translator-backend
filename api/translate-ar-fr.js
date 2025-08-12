export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Texte manquant' });
  }

  // Ici, tu mettras ton code de traduction avec ton API
  res.status(200).json({ translated: `Traduction de : ${text}` });
}
