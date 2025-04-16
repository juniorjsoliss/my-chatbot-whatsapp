const {
    createBot,
    createProvider,
    createFlow,
    addKeyword,


} = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');
const axios = require('axios');

// Configuración Api de AppSheet y llave de acceso
const APPSHEET_API_URL =
    'https://api.appsheet.com/api/v2/apps/d3a29a80-b285-476f-aee2-23281318c6ee/tables/gastos/Action';
const APPSHEET_API_KEY = 'V2-wsk7V-eBuPy-eLsH2-KT7dy-TbpUK-JLgD7-xOCCD-P1YO4';

const flowWeb = addKeyword(['web']).addAnswer(
    'Esta es nuestra página web: www.empresa.com'
);


const flowTikTok = addKeyword(['tiktok']).addAnswer('Este es mi perfil de TikTok :  https://www.tiktok.com/@juniorjsolis?_t=ZS-8vLzDNzWE8w&_r=1');

const flowGasto = addKeyword(['gasto'])
    .addAnswer(
        ' Vamos a registrar un gasto. ✍️'
    )
    .addAnswer(
        '¿Cuál es el nombre del gasto que deseas registrar: 🫡?',
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            const nombreGasto = ctx.body;
            await state.update({ nombreGasto});
            await flowDynamic(
                'Nombre Guardado: ${nombreGasto}'
            );
        }
    )
    
    
    .addAnswer(
        '¿Cuál es el valor del gasto : 🤑🫰?',
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            const valorGasto = ctx.body;
            await state.update({ valorGasto});
            await flowDynamic(
              ' Valor o precio guardado: ${valorGasto}'
            );
        }
    )
 

    .addAnswer(
        '¿Cuál es la categoría del gasto : 📃?',
        { capture: true },
        async (ctx, { flowDynamic, state }) => {
            const categoriaGasto = ctx.body;
            const { nombreGasto, valorGasto } = await state.getMyState();
            console.log('Datos a enviar:', {
                nombreGasto,
                valorGasto,
                categoriaGasto,
            });

            const payload = {
                Action: 'Add',
                Properties: { Locale: 'es-ES' },
                Rows: [
                    {
                        'nombre del gasto': nombreGasto,
                        valor: parseFloat(valorGasto),
                        categoria: categoriaGasto,
                    },
                ],
            };

            console.log('Payload completo:', JSON.stringify(payload, null, 2));

            try {
                const response = await axios.post(APPSHEET_API_URL, payload, {
                    headers: {
                        ApplicationAccessKey: APPSHEET_API_KEY,
                        'Content-Type': 'application/json',
                    },
                });

                console.log(
                    'Respuesta completa de AppSheet:',
                    JSON.stringify(response.data, null, 2)
                );

                if (response.status === 200) {
                    await flowDynamic('Gasto registrado con éxito en AppSheet.');
                } else {
                    console.error(
                        'Respuesta inesperada de AppSheet:',
                        response.status,
                        response.statusText
                    );
                    await flowDynamic(
                        'Hubo un problema al registrar el gasto. Por favor, intenta nuevamente.'
                    );
                }
            } catch (error) {
                console.error(
                    'Error al registrar el gasto:',
                    error.response
                        ? JSON.stringify(error.response.data, null, 2)
                        : error.message
                );
                console.error('Stack trace:', error.stack);
                await flowDynamic(
                    'Ocurrió un error al registrar el gasto. Por favor, intenta más tarde.'
                );
            }
        }
    );


//Flujo Principal 
const flowMain = addKeyword(['juniorDev'])
    .addAnswer(
        'Hello soy el bot JuniorDev 🤖, a continuación tienes las siguientes opciones:'
    )
    .addAnswer(
        [
            '📋 *Menú Principal*',
            '',
            '1️⃣ Escribe *web* para ver nuestra página web 🌐',
            '2️⃣ Escribe *gasto* para registrar un gasto en la base de datos 📝',
            '3️⃣ Escribe *tiktok* para ver mi perfil en TikTok 😎📱',
            '',
            '💬 *¿Qué opción deseas usar?* Escribe la palabra clave correspondiente.'
          ],
        null,
        null,
        [flowWeb, flowGasto , flowTikTok ]
    );

const main = async () => {
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([flowMain]);
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
};

main();