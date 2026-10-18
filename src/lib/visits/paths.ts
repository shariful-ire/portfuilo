export function publicVisitPath(path:string){return /^\/(?:$|about\/?$|ideas\/?$|certificates\/?$|(?:projects|posts|products)(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?\/?$)/.test(path);}
