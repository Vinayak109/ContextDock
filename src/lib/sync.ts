import { auth } from './firebase';
import { supabase } from './supabase';
import { Workspace } from '../App';

let cloudSyncAvailable = true;

export async function syncWorkspacesToCloud(workspaces: Workspace[]) {
  if (!auth?.currentUser || !supabase || !cloudSyncAvailable) return;
  
  try {
    const userId = auth.currentUser.uid;
    const { error } = await supabase
      .from('users')
      .upsert({ 
        id: userId, 
        workspaces: workspaces 
      }, { onConflict: 'id' });
    if (error) {
      cloudSyncAvailable = false;
    }
  } catch {
    cloudSyncAvailable = false;
  }
}

export async function fetchWorkspacesFromCloud(): Promise<Workspace[] | null> {
  if (!auth?.currentUser || !supabase || !cloudSyncAvailable) return null;
  
  try {
    const userId = auth.currentUser.uid;
    const { data, error } = await supabase
      .from('users')
      .select('workspaces')
      .eq('id', userId)
      .maybeSingle();
      
    if (error) {
      cloudSyncAvailable = false;
      return null;
    }
    return data?.workspaces as Workspace[] | null;
  } catch {
    cloudSyncAvailable = false;
    return null;
  }
}

export async function syncCreditsToCloud(credits: number) {
  if (!auth?.currentUser || !supabase || !cloudSyncAvailable) return;
  try {
    const userId = auth.currentUser.uid;
    const { error } = await supabase
      .from('users')
      .upsert({ id: userId, credits: credits }, { onConflict: 'id' });
    if (error) {
      cloudSyncAvailable = false;
    }
  } catch {
    cloudSyncAvailable = false;
  }
}

export async function fetchCreditsFromCloud(): Promise<number | null> {
  if (!auth?.currentUser || !supabase || !cloudSyncAvailable) return null;
  try {
    const userId = auth.currentUser.uid;
    const { data, error } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      cloudSyncAvailable = false;
      return null;
    }
    return (data?.credits ?? null) as number | null;
  } catch {
    cloudSyncAvailable = false;
    return null;
  }
}

