import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Row,
  Column,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
 
/**
 * Plantilla reutilizable para códigos de verificación (registro,
 * recuperación de contraseña, doble factor, etc). Pásale `code` y
 * opcionalmente `expiresInMinutes` y `actionLabel`.
 */
export default function VerificationCodeEmail({
  code = "482913",
  expiresInMinutes = 10,
  actionLabel = "verificar tu cuenta",
}) {
  const digits = String(code).split("");
 
  return (
    <Html>
      <Head />
      <Preview>Tu código es {code}</Preview>
      <Tailwind>
        <Body className="bg-[#000000] font-sans py-10">
          <Container className="mx-auto max-w-[420px] rounded-[20px] border border-solid border-[#2a2a2a] bg-[#0a0a0a] p-8 text-center">
            <Text className="m-0 text-xs uppercase tracking-wide text-[#00FF37]">
              Verificación
            </Text>
            <Heading className="mt-2 mb-2 text-xl text-white">
              Usa este código para {actionLabel}
            </Heading>
            <Text className="mb-6 text-sm text-[#8a8a8a]">
              Expira en {expiresInMinutes} minutos.
            </Text>
 
            <Section>
              <Row>
                <Column align="center">
                  <table
                    role="presentation"
                    cellPadding="0"
                    cellSpacing="0"
                    style={{ margin: "0 auto" }}
                  >
                    <tr>
                      {digits.map((digit, i) => (
                        <td key={i} style={{ padding: "0 4px" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "52px",
                              borderRadius: "12px",
                              border: "1px solid #2a2a2a",
                              backgroundColor: "#111111",
                              color: "#ffffff",
                              fontSize: "22px",
                              fontWeight: 600,
                              lineHeight: "52px",
                              textAlign: "center",
                            }}
                          >
                            {digit}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </table>
                </Column>
              </Row>
            </Section>
 
            <Text className="mt-8 text-[11px] text-[#5a5a5a]">
              Si no solicitaste este código, puedes ignorar este correo.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}