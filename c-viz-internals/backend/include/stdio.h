#ifndef _STDIO_H
#define _STDIO_H

#define NULL ((void *)0)
typedef unsigned long long size_t;

typedef struct _iobuf {
  char *_ptr;
  int _cnt;
  char *_base;
  int _flag;
  int _file;
  int _charbuf;
  int _bufsiz;
  char *_tmpfname;
} FILE;

extern FILE *stdin;
extern FILE *stdout;
extern FILE *stderr;

int printf(const char *format, ...);
int fprintf(FILE *stream, const char *format, ...);
int sprintf(char *buffer, const char *format, ...);
int scanf(const char *format, ...);

#endif
