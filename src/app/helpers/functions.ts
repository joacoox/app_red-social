
export const funciones = {

    generarHash(lenght : number = 10): string {
        const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let hash = '';
        for (let i = 0; i < lenght; i++) {
            const randomIndex = Math.floor(Math.random() * caracteres.length);
            hash += caracteres[randomIndex];
        }
        return hash;
    }
}