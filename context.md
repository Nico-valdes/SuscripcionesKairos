# Contexto del Proyecto: Sistema Automatizado de Gestión de Clientes y Suscripciones (MVP / Agencia)

## 1. Idea del Proyecto y Modelo de Negocio
El sistema es una plataforma propia para un desarrollador freelance o agencia de software. El objetivo principal es **automatizar y digitalizar el cobro de servicios recurrentes** (mantenimiento web mensual, hosting anual, soporte técnico por hora) con montos y conceptos personalizados para cada cliente.

### Flujo de Experiencia de Usuario (UX):
1. **Administrador (Yo):** Ingresa al panel de administración, crea un cliente con su nombre, correo electrónico, una contraseña temporal, define el concepto (ej: *"Hosting Anual + Dominio"*), el monto en pesos (ARS), la frecuencia del cobro (mensual o anual) y un enlace/ID de sus estadísticas.
2. **Generación del Cobro:** Al guardar el cliente, el backend consume la API de Preaprobaciones (Suscripciones) de Mercado Pago para generar un plan dinámico y un enlace de pago (`init_point`). El cliente se inicializa con el estado `pending_payment`.
3. **Muro de Pago (Client-side):** El cliente inicia sesión. Si su estado es `pending_payment` o `suspended`, el sistema bloquea el acceso al dashboard y le muestra una pantalla limpia con el botón de Mercado Pago para adherirse al débito automático.
4. **Activación Automática (Webhook):** Al concretarse el pago, Mercado Pago envía una notificación vía Webhook a nuestro servidor. El sistema identifica al usuario mediante los `metadata` del pago y cambia su estado a `active`.
5. **Dashboard Protegido:** Una vez activo, el cliente puede ingresar normalmente a la plataforma para visualizar sus reportes o estadísticas web (que inicialmente se renderizarán a través de un `<iframe>` de Google Looker Studio o componentes con datos simulados).

---

## 2. Stack Tecnológico Elegido
* **Frontend y Backend (Fullstack):** Next.js (App Router) con Tailwind CSS.
* **Base de Datos y Autenticación:** Supabase (PostgreSQL).
* **Pasarela de Pagos:** SDK Oficial de Mercado Pago para Node.js (Entorno de Sandbox para pruebas).
* **Herramientas de Testing:** `ngrok` o `localtunnel` para exponer el servidor local y recibir los Webhooks de Mercado Pago.

---

## 3. Estado Actual: Base de Datos ya Creada (Supabase)
Ya se ejecutó el diseño relacional de la base de datos en PostgreSQL dentro de Supabase utilizando el SQL Editor. Cuenta con tres tablas principales con Row Level Security (RLS) habilitado y un Trigger automático para sincronizar la autenticación:

```sql
-- 1. Tabla de perfiles vinculada a auth.users de Supabase
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at timestamp with time zone,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  status text DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'active', 'suspended')),
  analytics_url text,
  role text DEFAULT 'client' CHECK (role IN ('admin', 'client'))
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Tabla de suscripciones vinculadas a la API de Mercado Pago
CREATE TABLE public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mp_preapproval_id text UNIQUE,
  mp_init_point text,
  concept text NOT NULL,
  amount numeric(10, 2) NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'yearly')),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Tabla de historial de pagos (Auditoría de Webhooks)
CREATE TABLE public.payment_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  mp_payment_id text UNIQUE NOT NULL,
  amount_paid numeric(10, 2) NOT NULL,
  payment_status text NOT NULL,
  paid_at timestamp with time zone NOT NULL
);

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- 4. Trigger automático: Cuando se crea un usuario en auth.users, se inserta en public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, status)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Cliente'), 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'client'),
    'pending_payment'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users


## 4. Requerimientos Técnicos y Siguientes Pasos

El sistema debe cumplir con el aislamiento estricto de variables de entorno (`.env.local`) para que el `Access Token` y la `Public Key` de Mercado Pago nunca se expongan en el cliente. El flujo de código debe ser modular para permitir, en el futuro, migrar hacia una arquitectura Multi-tenant (SaaS para otros desarrolladores vía OAuth).

### Tareas actuales a desarrollar:

1. **Configuración del Middleware de Next.js:** Bloquear rutas según el `role` (`admin` o `client`) y restringir el acceso al `/dashboard` si el `status` del perfil es `pending_payment`.
2. **API Route de Alta de Cliente:** Endpoint que use el SDK de Supabase para registrar la cuenta del cliente y use el SDK de Mercado Pago (`preapproval`) para crear la suscripción con montos dinámicos e inyectar el `user_id` en el objeto `metadata`.
3. **API Route del Webhook de Mercado Pago:** Endpoint POST (`/api/webhooks/mercadopago`) para recibir los eventos de cobro autorizado, parsear los metadatos y actualizar la tabla `profiles` a `active`, además de poblar `payment_history`.
4. **Vistas de Frontend:** Panel de creación para el Admin, Muro de pago para el cliente pendiente y Dashboard con el `<iframe>` condicional para el cliente activo.

