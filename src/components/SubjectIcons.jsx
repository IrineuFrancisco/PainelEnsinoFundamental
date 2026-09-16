import React from 'react';

export function AbcIcon() {
  return (
    <svg width="110" height="54" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* A */}
      <path d="M12 48L24 10L36 48M16 36H32" stroke="#3B82F6" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="24" cy="10" r="4" fill="#EF4444" />
      {/* B */}
      <path d="M48 10H64C70 10 74 14 74 19C74 24 70 27 64 27H48V10ZM48 27H66C72 27 77 31 77 37.5C77 44 72 48 66 48H48V27Z" fill="#10B981"/>
      {/* C */}
      <path d="M110 20C106 14 98 10 90 10C76 10 66 21 66 35C66 49 76 50 90 50C98 50 106 46 110 40" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  );
}

export function ScienceIcon() {
  return (
    <svg width="100" height="54" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Flask 1 */}
      <path d="M25 10V22L12 48C10 52 13 56 18 56H42C47 56 50 52 48 48L35 22V10" stroke="#8B5CF6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#F3E8FF"/>
      <path d="M18 42H42" stroke="#A855F7" strokeWidth="4"/>
      <circle cx="30" cy="34" r="3" fill="#EC4899"/>
      <circle cx="26" cy="46" r="4" fill="#3B82F6"/>

      {/* Flask 2 */}
      <path d="M70 14V24L58 48C56 52 59 56 64 56H86C91 56 94 52 92 48L80 24V14" stroke="#10B981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="#E6F7F5"/>
      <path d="M63 40H87" stroke="#059669" strokeWidth="4"/>
      <circle cx="75" cy="30" r="3" fill="#F59E0B"/>
      <circle cx="78" cy="46" r="3.5" fill="#EF4444"/>
    </svg>
  );
}

export function NumbersIcon() {
  return (
    <svg width="110" height="54" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 1 */}
      <path d="M16 20L25 10V48" stroke="#3B82F6" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      {/* 2 */}
      <path d="M44 18C44 13 49 10 56 10C63 10 68 14 68 20C68 28 44 38 44 48H70" stroke="#EC4899" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
      {/* 3 */}
      <path d="M86 10H108L96 26C104 26 110 31 110 38C110 44 104 50 94 50C86 50 82 46 80 42" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
