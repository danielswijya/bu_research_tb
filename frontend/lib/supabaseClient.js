import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwqqbxpheiccvobrtcog.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3cXFieHBoZWljY3ZvYnJ0Y29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzNzUyMDksImV4cCI6MjA1OTk1MTIwOX0.dEX0JXcA-dytiEQnKxPkt_bQmFtziEXDlPrfFWq2FiA'; // from Supabase → Project Settings → API

export const supabase = createClient(supabaseUrl, supabaseKey);
