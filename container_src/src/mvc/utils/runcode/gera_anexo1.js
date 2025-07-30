const contratos = [
    "OND-41145253545740-2024",
    "OND-52688131753996-2024",
    "OND-65717689353709-2024",
    "OND-19326556240512-2024",
    "OND-50881098286138-2024",
    "OND-54136602742724-2024",
    "OND-46626677835943-2024",
    "OND-32266193788746-2024",
];

const myHeaders = new Headers();
myHeaders.append(
    "Authorization",
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvbmRhX3VzZXJfdXNlcm5hbWUiOiJHdWlsaGVybWUgZGUgU291emEiLCJvbmRhX3VzZXJfZGVwYXJ0YW1lbnRvIjoiYWRtaW5pc3RyYXRpdm8iLCJvbmRhX3VzZXJfZW1haWwiOiJzZWZsYW5ndWlsaGVybWVzb3V6YUBnbWFpbC5jb20iLCJvbmRhX3VzZXJfaWQiOjc0LCJvbmRhX2ltb2JfaWQiOjAsIm9uZGFfY29sYWJvcmFkb3JfaWQiOjAsInR5cGVfdXNlciI6Ik9OREFfVVNFUiIsImlhdCI6MTcxMjE3MTQ1OH0.NB4HYLDtcDrXxhLtaOO-g6iYUvgJ73gjszDrTY4uzqM"
);

const raw = "";

const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
};

for (const contrato of contratos) {
    fetch(`https://api-wave.ondasegura.com.br/analise/anexo1/${contrato}/anexo1/false`, requestOptions)
        .then((response) => response.text())
        .then((result) => console.log(result))
        .catch((error) => console.error(error));
}
