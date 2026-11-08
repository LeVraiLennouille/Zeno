/**
 * Déclarations MINIMALES de React / React Native / Expo, uniquement pour
 * `npm run typecheck:shim` quand les vrais paquets ne sont pas installés.
 * Les composants sont typés `any` (leurs props ne sont pas vérifiées) ; les hooks
 * et tout ce qui touche au domaine et au store, eux, sont vérifiés pour de vrai.
 * `npm run typecheck` (avec les vrais types) fait foi.
 */
declare namespace JSX {
  type Element = any;
  interface IntrinsicElements { [name: string]: any }
  interface IntrinsicAttributes { key?: any }
  interface ElementChildrenAttribute { children: {} }
}

declare module 'react' {
  export type ReactNode = any;
  export type PropsWithChildren<P = unknown> = P & { children?: any };
  export type ComponentType<P = any> = any;
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prev: S) => S);
  export function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useRef<T>(initial: null): { current: T | null };
  export function useRef<T>(initial: T): { current: T };
  export type ComponentRef<T> = T extends { prototype: infer I } ? I : any;
  export function useId(): string;
  export function useCallback<T extends (...args: any[]) => any>(fn: T, deps: readonly unknown[]): T;
  export function useContext<T>(ctx: Context<T>): T;
  export function useSyncExternalStore<T>(subscribe: (cb: () => void) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T): T;
  export interface Context<T> { Provider: any; _t?: T }
  export function createContext<T>(defaultValue: T): Context<T>;
}

declare module 'react-native' {
  export const Text: any, TextInput: any;
  export const Easing: { inOut(fn: unknown): unknown; ease: unknown };
  export const View: (props: { onLayout?: (e: { nativeEvent: { layout: { width: number; height: number } } }) => void; [k: string]: any }) => any;
  export class ScrollView {
    constructor(props: { onContentSizeChange?: (w: number, h: number) => void; [k: string]: any });
    scrollTo(options: { x?: number; y?: number; animated?: boolean }): void;
  }
  export const Pressable: (props: { style?: object | ((state: { pressed: boolean }) => object); [k: string]: any }) => any;
  export namespace Animated {
    class Value { constructor(v: number); interpolate(config: any): any; setValue(v: number): void }
    const View: any;
    function timing(v: Value, config: any): { start(cb?: () => void): void; stop(): void };
    function loop(a: any): { start(): void; stop(): void };
    function sequence(a: any[]): { start(cb?: () => void): void };
    function parallel(a: any[]): { start(cb?: () => void): void };
  }
  export const StyleSheet: { create<T>(styles: T): T; absoluteFill: any };
  export const Platform: { OS: 'ios' | 'android' | 'web' };
  export const Alert: { alert(title: string, message?: string, buttons?: any[], options?: any): void };
  export const AccessibilityInfo: { isReduceMotionEnabled(): Promise<boolean> };
  export const AppState: { addEventListener(type: 'change', cb: (s: string) => void): { remove(): void } };
  export function useWindowDimensions(): { width: number; height: number };
  export function useColorScheme(): 'light' | 'dark' | null | undefined;
  export type TextStyle = any;
  export type ViewStyle = any;
  export type StyleProp<T> = any;
  export type ViewProps = any;
  export type TextProps = any;
  export type PressableProps = any;
}

declare module 'react-native-svg' {
  const Svg: any;
  export default Svg;
  export const Circle: any, Ellipse: any, Line: any, Path: any, Polygon: any, Polyline: any, Rect: any, Defs: any, G: any, LinearGradient: any, Stop: any, Text: any;
}
declare module 'react-native-safe-area-context' {
  export const SafeAreaProvider: any;
  export function useSafeAreaInsets(): { top: number; bottom: number; left: number; right: number };
}
declare module 'expo-router' {
  export const Link: any, Stack: any, Redirect: any;
  export interface ErrorBoundaryProps { error: Error; retry: () => Promise<void> }
  export const Tabs: ((props: any) => any) & {
    Screen: (props: { name: string; options?: { [k: string]: any; tabBarIcon?: (p: { color: string; size: number }) => any } }) => any;
  };
  export function useRouter(): { back(): void; push(href: any): void; replace(href: any): void; setParams(p: Record<string, string>): void };
  export function usePathname(): string;
  export function useLocalSearchParams<T extends Record<string, string>>(): Partial<T>;
}
declare module 'expo-clipboard' { export function setStringAsync(text: string): Promise<boolean>; }
declare module 'expo-audio' {
  export interface AudioPlayer { play(): void; pause(): void; seekTo(seconds: number): Promise<void>; loop: boolean; volume: number }
  export function createAudioPlayer(source: unknown): AudioPlayer;
}
declare module 'expo-keep-awake' {
  export function activateKeepAwakeAsync(tag?: string): Promise<void>;
  export function deactivateKeepAwake(tag?: string): Promise<void>;
}
declare module 'expo-notifications' {
  export const AndroidImportance: { DEFAULT: number };
  export const SchedulableTriggerInputTypes: { DATE: 'date' };
  export function setNotificationHandler(h: { handleNotification: () => Promise<Record<string, boolean>> }): void;
  export function setNotificationChannelAsync(id: string, c: { name: string; importance: number }): Promise<unknown>;
  export function getPermissionsAsync(): Promise<{ granted: boolean; canAskAgain: boolean }>;
  export function requestPermissionsAsync(): Promise<{ granted: boolean }>;
  export function cancelAllScheduledNotificationsAsync(): Promise<void>;
  export function scheduleNotificationAsync(r: { content: { title: string; body: string; data?: object }; trigger: null | { type: 'date'; date: Date; channelId?: string } }): Promise<string>;
}
declare module 'expo-document-picker' {
  export function getDocumentAsync(o: object): Promise<{ canceled: boolean; assets: { uri: string; size?: number }[] }>;
}
declare module 'expo-sharing' {
  export function isAvailableAsync(): Promise<boolean>;
  export function shareAsync(uri: string, o?: object): Promise<void>;
}
declare module 'expo-file-system' {
  export class File { constructor(...parts: unknown[]); uri: string; create(o?: { overwrite?: boolean }): void; write(text: string): void }
  export const Paths: { cache: unknown };
}
declare module 'expo-router/html' { export const ScrollViewStyleReset: any; }
declare const __DEV__: boolean;
declare function fetch(url: string): Promise<{ text(): Promise<string> }>;
declare module 'expo-font' { export function useFonts(map: Record<string, unknown>): [boolean, Error | null]; }
declare module 'expo-splash-screen' { export function preventAutoHideAsync(): Promise<void>; export function hideAsync(): Promise<void>; }
declare module 'expo-status-bar' { export const StatusBar: any; }
declare module 'expo-constants' { const Constants: { expoConfig?: { version?: string } | null }; export default Constants; }
declare module 'expo-haptics' {
  export const ImpactFeedbackStyle: { Light: any }; export const NotificationFeedbackType: { Success: any; Warning: any };
  export function impactAsync(s: any): Promise<void>; export function notificationAsync(t: any): Promise<void>;
}
declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: { getItem(k: string): Promise<string | null>; setItem(k: string, v: string): Promise<void>; removeItem(k: string): Promise<void> };
  export default AsyncStorage;
}
declare function require(path: string): any;
declare function setTimeout(fn: () => void, ms?: number): number;
declare function clearTimeout(id: unknown): void;
declare function setInterval(fn: () => void, ms?: number): number;
declare function clearInterval(id: unknown): void;
declare const globalThis: any;
declare const console: { warn(...args: unknown[]): void };
