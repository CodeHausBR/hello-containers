export default function formatarOriginal(originalEstrutura, cod) {
    let viewOriginal = [];

    originalEstrutura.forEach((objetoPai) => {
        let objetoPage = {
            permissaoMatrix: cod,
            elementoType: "page",
            permissaoId: objetoPai.id,
            permissaoSetor: objetoPai.setor,
            permissaoCreate: objetoPai.create ? 1 : 0,
            permissaoPermitir: objetoPai.read ? 1 : 0,
        };

        viewOriginal.push(objetoPage);

        objetoPai.componetes.forEach((filho) => {
            let objetoFilho = {
                permissaoMatrix: cod,
                elementoType: "function",
                permissaoId: filho.id,
                permissaoCreate: filho.create ? 1 : 0,
                permissaoPermitir: filho.read ? 1 : 0,
            };

            viewOriginal.push(objetoFilho);
        });
    });

    return viewOriginal;
}
