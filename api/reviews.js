export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || "Reviews";

    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
      return res.status(500).json({
        error: "Missing Airtable environment variables."
      });
    }

    const formula = encodeURIComponent("{Show on Website}=1");
    const sort = encodeURIComponent("Featured Order");

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(
      AIRTABLE_TABLE_NAME
    )}?filterByFormula=${formula}&sort%5B0%5D%5Bfield%5D=${sort}&sort%5B0%5D%5Bdirection%5D=asc`;

    const airtableResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`
      }
    });

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      return res.status(airtableResponse.status).json({
        error: "Airtable request failed.",
        details: errorText
      });
    }

    const data = await airtableResponse.json();

    const reviews = data.records.map((record) => {
      const fields = record.fields;

      return {
        id: record.id,
        name: fields["Name"] || "",
        text: fields["Review Text"] || "",
        rating: fields["Rating"] || 5,
        source: fields["Source"] || "Google",
        reviewDate: fields["Review Date"] || "",
        featuredOrder: fields["Featured Order"] || 999,
        profilePhoto:
          fields["Profile Photo"] && fields["Profile Photo"][0]
            ? fields["Profile Photo"][0].url
            : ""
      };
    });

    return res.status(200).json({ reviews });
  } catch (error) {
    return res.status(500).json({
      error: "Server error.",
      details: error.message
    });
  }
}
