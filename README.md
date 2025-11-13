# Nexus

![Nexus. The composable backend. Build with intention](Assets/Nexus%20-%20Card.png "Nexus Banner")

**A lightweight, event-driven, layer-stack framework for building modular Node.js applications with TypeScript.**

Nexus provides a simple yet powerful architecture for your backend applications, inspired by game engine design. It's built around two core concepts: a **Layer Stack** for processing logic in stages and a global **Event Bus** for decoupled, application-wide communication.

This structure allows you to build complex applications where components are completely isolated, making them easy to test, maintain, and scale.

## Core Philosophy

1. **Layers:** Your application logic is divided into `Layers`. An event or update tick flows through the stack, allowing each layer to inspect, handle, or pass on the data.

2. **Events:** Layers and services don't call each other directly. Instead, they **emit events** (e.g., `UserRegisterEvent`) onto a central `EventBus`.

3. **Services:** Other layers or services can **listen** for these events (e.g., `EmailService` listens for `UserRegisterEvent`) and react accordingly.

4. **DI:** A simple, built-in `ServiceLocator` provides easy Dependency Injection for your services (like `ConfigService` or `DatabaseService`) without any "prop drilling."

## Key Features

* **Layer Stack:** A powerful middleware-like system. Push layers and overlays to manage logic flow.

* **Event-Driven:** A global EventBus (Pub/Sub) allows deep decoupling between modules.

* **Simple DI:** Built-in ServiceLocator for clean dependency injection.

* **Lightweight:** Zero external dependencies in the core.

* **Type-Safe:** Written entirely in TypeScript.

## Ideal For

Nexus is perfect for any application that benefits from a clear separation of concerns:

* Event-driven Microservices

* Backend APIs (REST, GraphQL)

* Real-time applications (WebSockets)

* Chat Bots (Discord, Slack, etc.)

* Game server backends

## Basic Usage

Here is what a minimal `app-api` application looks like using `Nexus`:

`main.ts`

```typescript
import {
    Application,
    ApplicationSpecification,
    Event,
    Layer,
    Log,
    ServiceLocator
} from "@prism-dev/nexus";

// 1. Define a simple Layer.
class MyLayer extends Layer {
    OnAttach(): void {
        Log.Info("MyLayer Attached!");
        // You can get services anywhere.
        // const config = ServiceLocator.Get(ConfigService);
    }

    OnDetach(): void {}
    OnUpdate(ts: number): void {}

    OnEvent(event: Event): void {
        Log.Info(`MyLayer saw event: ${event.Name}`);
    }
}

// 2. Create the Application.
(async () => {
    const spec: ApplicationSpecification = { Name: "MyApp" };
    const app: Application = new Application(spec);

    try {
        // 3. Register & Initialize Services.
        // app.RegisterService(ConfigService, new ConfigService());
        await app.InitializeServices();
    } catch (error) {
        console.error("Failed to initialize services!", error);
        process.exit(1);
    }
    
    // 4. Push Layers.
    app.PushLayer(new MyLayer());

    // 5. Run the Application.
    app.Run();

    // 6. Handle shutdown.
    process.on('SIGINT', () => app.Close());
})();
```