import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
 
/**
 * Correo enviado al cliente cuando su pedido se paga y los códigos
 * de juego se entregan automáticamente.
 *
 * @param {Object} props
 * @param {string} props.nombre - nombre del cliente
 * @param {string} props.orderId - id de la orden (se muestra recortado)
 * @param {{ productName: string, code: string }[]} props.items
 */
export default function OrderCodeEmail({ nombre = "Cliente", orderId = "", items = [] }) {
  const shortId = String(orderId).slice(-8);
 
  return (
    <Html>
      <Head />
      <Preview>Tu(s) código(s) del pedido #{shortId} ya están listos</Preview>
      <Tailwind>
        <Body className="bg-[#000000] font-sans py-10">
          <Container className="mx-auto max-w-[480px] rounded-[20px] border border-solid border-[#2a2a2a] bg-[#0a0a0a] p-8">
            <Text className="m-0 text-xs uppercase tracking-wide text-[#00FF37]">
              Pedido confirmado
            </Text>
            <Heading className="mt-2 mb-2 text-2xl text-white">
              ¡Gracias, {nombre}!
            </Heading>
            <Text className="mb-6 text-sm text-[#8a8a8a]">
              Pedido #{shortId} — aquí tienes tu(s) código(s):
            </Text>
 
            {items.map((item, i) => (
              <Section
                key={i}
                className="mb-4 rounded-[16px] border border-solid border-[#2a2a2a] bg-[#111111] p-4"
              >
                <Text className="m-0 text-xs text-[#8a8a8a]">
                  {item.productName}
                </Text>
                <Text
                  className="mt-2 mb-0 text-lg font-bold tracking-widest"
                  style={{ color: "#00FF37" }}
                >
                  {item.code}
                </Text>
              </Section>
            ))}
 
            <Hr className="my-6 border-[#2a2a2a]" />
 
            <Text className="m-0 text-[11px] text-[#5a5a5a]">
              Guarda este correo, es tu comprobante de entrega. Si tienes
              algún problema con tu código, responde a este correo.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}