import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { ConsoleMetricExporter, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';


export const startTracing = async (): Promise<NodeSDK> => {
  const sdk = new NodeSDK({
    traceExporter: new ConsoleSpanExporter(),
    metricReaders: [
      new PeriodicExportingMetricReader({
        exporter: new ConsoleMetricExporter(),
        exportIntervalMillis: 60000,
      }),
    ],
    instrumentations: [
      getNodeAutoInstrumentations(),  // auto instrumentations for built-in modules and common packages
      new PinoInstrumentation(),      // attach to and send pino logs to opentelemetry logging sdk
    ],
  });

  sdk.start();
  return sdk;
}
