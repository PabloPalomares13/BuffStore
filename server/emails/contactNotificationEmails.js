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
 * Correo interno: se envía a TU bandeja cuando alguien llena el
 * formulario de contacto. Diseño plano (sin blur) compatible con
 * clientes de correo, manteniendo negro + acentos neón + bordes redondeados.
 */
export default function ContactNotificationEmail({
  nombre = "Nombre no indicado",
  correo = "correo@ejemplo.com",
  mensaje = "Sin mensaje",
}) {
  return (
    <Html>
      <Head />
      <Preview>Nuevo mensaje de contacto de {nombre}</Preview>
      <Tailwind>
        <Body className="bg-[#000000] font-sans py-10">
          <Container className="mx-auto max-w-[480px] rounded-[20px] border border-solid border-[#2a2a2a] bg-[#0a0a0a] p-8">
            <Text className="m-0 text-xs uppercase tracking-wide text-[#FF137A]">
              Nuevo contacto
            </Text>
            <Heading className="mt-2 mb-6 text-2xl text-white">
              Tienes un nuevo mensaje
            </Heading>

            <Text className="m-0 text-xs text-[#8a8a8a]">Nombre</Text>
            <Text className="mt-1 mb-4 text-base text-white">{nombre}</Text>

            <Text className="m-0 text-xs text-[#8a8a8a]">Correo</Text>
            <Text className="mt-1 mb-4 text-base text-white">{correo}</Text>

            <Hr className="my-4 border-[#2a2a2a]" />

            <Text className="m-0 text-xs text-[#8a8a8a]">Mensaje</Text>
            <Text className="mt-1 text-base leading-relaxed text-white">
              {mensaje}
            </Text>

            <Hr className="my-6 border-[#2a2a2a]" />

            <Text className="m-0 text-[11px] text-[#5a5a5a]">
              Este correo se generó automáticamente desde el formulario de
              contacto de tu sitio.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}