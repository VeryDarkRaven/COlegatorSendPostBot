import express from "express";



function expressStart(): void {
  const app = express();
  const host = "0.0.0.0";
  const port = 3000;

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.listen(port, host, () => {
    console.log(`Example app listening on ${host}:${port}`);
  });
}



export { expressStart };