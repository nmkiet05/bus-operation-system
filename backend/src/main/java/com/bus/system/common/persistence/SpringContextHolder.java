package com.bus.system.common.persistence;

import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

/**
 * Utility class to access Spring beans from non-Spring managed classes (like
 * JPA EntityListeners).
 */
@Component
public class SpringContextHolder implements ApplicationContextAware {

    private static ApplicationContext context;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        context = applicationContext;
    }

    public static <T> T getBean(Class<T> beanClass) {
        if (context == null) {
            throw new IllegalStateException("ApplicationContext has not been initialized yet.");
        }
        return context.getBean(beanClass);
    }
}
