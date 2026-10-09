/** Compile-time dev flag AND localhost; never enabled on a production bundle. */
export function isDemoAllowed(env:{DEV:boolean;flag?:string;hostname:string}):boolean {
 return env.DEV===true&&env.flag==='true'&&['localhost','127.0.0.1','[::1]'].includes(env.hostname);
}
