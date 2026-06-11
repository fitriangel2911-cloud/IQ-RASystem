fetch("http://localhost:3000/api/ai/test-langchain")
  .then(res => {
    if (!res.ok) {
      return res.text().then(text => { throw new Error(`HTTP ${res.status}: ${text}`); });
    }
    return res.json();
  })
  .then(() => {
    console.log("=========================================");
    console.log("API TEST SUCCESSFUL!");
    console.log("=========================================");
    process.exit(0);
  })
  .catch(err => {
    console.error("API TEST FAILED:", err);
    process.exit(1);
  });
