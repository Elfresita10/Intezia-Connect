import { createClient } from '@libsql/client';

const url = "https://intezia-connect-elfresita1012.aws-us-east-2.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE4MDM5MjQyNzEsImlhdCI6MTc3MjM4ODI3MSwiaWQiOiIwMTljYWE5Mi01ZTFrNmFBpzPfDvDX8m4i7KdjsoNxzK2E62aiLCJyaWQiOiI4ZDgwMTRkZi1lZDJmLTQxZDQtYjYyMy02Mjk2MjUzY2MzYWYifQ.-ZA8NkEfLiTGvbmyYgNtLJBDwJkrwsdaza7-sIJeHRR0JHKJKoFJ4kIOThciQnbE7DGwQOqOc7DsIdPEe8noDA";

async function test() {
    const client = createClient({ url, authToken });
    try {
        const res = await client.execute("SELECT 1");
        console.log("SUCCESS:", res);
    } catch (e: any) {
        console.error("FAIL:", e.message);
        if (e.cause) console.error("CAUSE:", e.cause.message || e.cause);
    }
}

test();
