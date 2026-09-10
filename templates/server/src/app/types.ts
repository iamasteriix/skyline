export type AppAttributes = {
  endpoint: string;
  port: number;
  shutdown: () => Promise<void>;
};
