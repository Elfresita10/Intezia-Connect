const url = "https://intezia-connect-elfresita1012.aws-us-east-2.turso.io/v2/pipeline";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE4MDM5MjQyNzEsImlhdCI6MTc3MjM4ODI3MSwiaWQiOiIwMTljYWE5Mi01ZTFrNmFBpzPfDvDX8m4i7KdjsoNxzK2E62aiLCJyaWQiOiI4ZDgwMTRkZi1lZDJmLTQxZDQtYjYyMy02Mjk2MjUzY2MzYWYifQ.-ZA8NkEfLiTGvbmyYgNtLJBDwJkrwsdaza7-sIJeHRR0JHKJKoFJ4kIOThciQnbE7DGwQOqOc7DsIdPEe8noDA";

async function test() {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${authToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: { sql: "SELECT 1" } },
                    { type: "close" }
                ]
            })
        });

        console.log("Status:", response.status);
        const body = await response.text();
        console.log("Body:", body);
    } catch (e: any) {
        console.error("FETCH ERROR:", e.message);
    }
}

test();
