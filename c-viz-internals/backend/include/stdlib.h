#ifndef _STDLIB_H
#define _STDLIB_H

#ifndef NULL
#define NULL ((void *)0)
#endif

#ifndef _SIZE_T_DEFINED
#define _SIZE_T_DEFINED
typedef unsigned long long size_t;
#endif

void *malloc(size_t size);
void *calloc(size_t num, size_t size);
void *realloc(void *ptr, size_t size);
void free(void *ptr);
void exit(int status);
int atoi(const char *str);
int rand(void);
void srand(unsigned int seed);

#endif
